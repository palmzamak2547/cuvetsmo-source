#!/usr/bin/env node
// cuvetsmo-source MCP server.
//
// Exposes the source.cuvetsmo.com verified veterinary drug data plane as MCP
// tools so any AI agent in the CUVETSMO ecosystem (cuvetsmo.com/chat, VetOS,
// or Claude directly) can ground answers in cited, cross-checked drug data
// instead of hallucinating. This is the "engine" surface of `source`: the
// website is the human-readable surface, the MCP is the machine surface, both
// over one source of truth (content/drugs + data/ontology).
//
// Transport: stdio (the universal MCP transport — works with Claude Desktop,
// Claude Code .mcp.json, and any stdio MCP client). An HTTP/SSE transport can
// be added later for remote ecosystem surfaces.
//
// Every tool result includes source URLs + verification tier so the calling
// agent can cite back to source.cuvetsmo.com — Iron Rule 0 at ecosystem scale.

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import {
  DRUGS, ATC,
  findBySlug, findByAtc, findByRxcui, searchDrugs,
  verifyCitation, summarize, verificationTier, classifyDrug,
} from './data.js'

const server = new Server(
  { name: 'cuvetsmo-source', version: '0.1.0' },
  { capabilities: { tools: {} } },
)

// ── tool catalog ──────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'search_drugs',
    description:
      'Search the source.cuvetsmo.com verified veterinary drug catalog by name (English or Thai), brand, ATC code, or indication. Returns compact summaries with verification tier + source URL. Use this first to find a drug, then get_drug for full detail.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Drug name, brand, ATC code, or clinical keyword (e.g. "meloxicam", "NSAID", "M01AC06", "canine seizure").' },
        limit: { type: 'number', description: 'Max results (default 10).' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_drug',
    description:
      'Get the full verified entry for one drug by slug (e.g. "meloxicam") — mechanism, indications, contraindications, dosages by species, side effects, interactions, monitoring, and every citation. Every clinical statement carries citation ids you can confirm with verify_citation.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string', description: 'Drug slug, e.g. "meloxicam", "enrofloxacin", "tmp-smx".' } },
      required: ['slug'],
    },
  },
  {
    name: 'get_by_code',
    description:
      'Look up drugs by medical ontology code — WHO ATC (exact like "M01AC06", or class-level prefix like "J01" for all antibiotics) or RxNorm CUI. This is the join key that lets other CUVETSMO surfaces (VetMock questions, imaging cases, chat) reference a drug and resolve it back to the verified source entry.',
    inputSchema: {
      type: 'object',
      properties: {
        system: { type: 'string', enum: ['atc', 'rxnorm'], description: 'Code system.' },
        code: { type: 'string', description: 'The code/CUI. For ATC, a prefix returns all drugs in that branch.' },
      },
      required: ['system', 'code'],
    },
  },
  {
    name: 'list_classes',
    description:
      'List the therapeutic classes in the catalog with drug counts. Use to browse the data plane structure or to pick a class for get_by_code prefix queries.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'verify_citation',
    description:
      'Confirm that a specific citation id on a drug entry exists and report whether it is content-addressed (has a CID) plus its source URL. Lets a calling agent prove a claim traces to a real authoritative source before repeating it — the core trust primitive of the data plane.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Drug slug.' },
        citationId: { type: 'string', description: 'Citation id, e.g. "merck-vet-nsaid", "fda-metacam".' },
      },
      required: ['slug', 'citationId'],
    },
  },
  {
    name: 'catalog_stats',
    description:
      'Report data-plane health: total drugs, classes, ontology code coverage, verification-tier breakdown, and total citations. Use to understand catalog scope.',
    inputSchema: { type: 'object', properties: {} },
  },
]

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

const ok = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] })
const err = (msg: string) => ({ content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }, null, 2) }], isError: true })

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params
  try {
    switch (name) {
      case 'search_drugs': {
        const q = String((args as any).query ?? '')
        const limit = Number((args as any).limit ?? 10)
        if (!q.trim()) return err('query is required')
        const hits = searchDrugs(q, limit)
        return ok({ query: q, count: hits.length, results: hits.map(h => ({ ...summarize(h.drug), relevance: h.score })) })
      }
      case 'get_drug': {
        const slug = String((args as any).slug ?? '')
        const drug = findBySlug(slug)
        if (!drug) return err(`no drug with slug "${slug}" — use search_drugs to find the right slug`)
        return ok({
          ...drug,
          verificationTier: verificationTier(drug),
          class: classifyDrug(drug),
          sourceUrl: `https://source.cuvetsmo.com/drugs/${drug.slug}`,
          disclaimer: 'Verified reference (cited + cross-checked). Confirm dose against your formulary / clinical judgment before use.',
        })
      }
      case 'get_by_code': {
        const system = String((args as any).system ?? '')
        const code = String((args as any).code ?? '')
        if (!code) return err('code is required')
        const hits = system === 'rxnorm' ? findByRxcui(code) : findByAtc(code)
        const resolved = system === 'atc' ? (ATC[code.toUpperCase()]?.name ?? null) : null
        return ok({ system, code, resolvedName: resolved, count: hits.length, results: hits.map(summarize) })
      }
      case 'list_classes': {
        const counts = new Map<string, { label: string; count: number }>()
        for (const d of DRUGS) {
          const k = classifyDrug(d)
          if (!k) continue
          const cur = counts.get(k.slug) ?? { label: k.label, count: 0 }
          cur.count++
          counts.set(k.slug, cur)
        }
        const classes = [...counts.entries()]
          .map(([slug, v]) => ({ slug, label: v.label, count: v.count, url: `https://source.cuvetsmo.com/drugs/class/${slug}` }))
          .sort((a, b) => b.count - a.count)
        return ok({ count: classes.length, classes })
      }
      case 'verify_citation': {
        const slug = String((args as any).slug ?? '')
        const citationId = String((args as any).citationId ?? '')
        if (!slug || !citationId) return err('slug and citationId are required')
        return ok(verifyCitation(slug, citationId))
      }
      case 'catalog_stats': {
        const tiers = { verified: 0, community: 0, expert: 0 }
        let withAtc = 0, withRxnorm = 0, citations = 0
        const classSet = new Set<string>()
        for (const d of DRUGS) {
          tiers[verificationTier(d)]++
          if (d.codes?.atc) withAtc++
          if (d.codes?.rxnorm) withRxnorm++
          citations += d.citations.length
          const k = classifyDrug(d)
          if (k) classSet.add(k.slug)
        }
        return ok({
          totalDrugs: DRUGS.length,
          therapeuticClasses: classSet.size,
          ontologyCoverage: { atc: withAtc, rxnorm: withRxnorm, atcTotalCodes: Object.keys(ATC).length },
          verificationTiers: tiers,
          totalCitations: citations,
          dataPlane: 'source.cuvetsmo.com — single source of truth for the CUVETSMO ecosystem',
        })
      }
      default:
        return err(`unknown tool: ${name}`)
    }
  } catch (e) {
    return err(`tool ${name} threw: ${(e as Error).message}`)
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
// stderr so it doesn't corrupt the stdio JSON-RPC channel
console.error(`cuvetsmo-source MCP ready · ${DRUGS.length} drugs · ${TOOLS.length} tools`)
