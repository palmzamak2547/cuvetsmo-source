// Shared server factory for the cuvetsmo-source MCP.
//
// Both transports (stdio in index.ts, streamable-HTTP in http.ts) build the
// SAME configured server from this factory — one tool catalog, one handler
// set, two ways to reach it. The website + REST API + this MCP all read the
// same on-disk content, and now this MCP speaks two transports over that one
// truth. (See README "data plane".)
//
// Output discipline: every tool returns COMPACT JSON (no indentation). Tool
// results land inside an LLM context window, where pretty-printing is pure
// token cost. get_drug additionally takes `sections` so a caller that only
// needs dosages does not pay for the whole monograph.

import { createRequire } from 'node:module'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import {
  DRUGS, ATC,
  findBySlug, findByAtc, findByRxcui, searchDrugs,
  verifyCitation, summarize, verificationTier, classifyDrug,
  type Drug,
} from './data.js'

// Single source for the version string: package.json (dist/ -> ../package.json).
const require = createRequire(import.meta.url)
const { version: PKG_VERSION } = require('../package.json') as { version: string }

const CONTENT_SECTIONS = [
  'mechanism', 'indications', 'contraindications', 'dosages', 'sideEffects',
  'interactions', 'monitoring', 'storage', 'pregnancyLactation', 'citations',
] as const
type SectionName = (typeof CONTENT_SECTIONS)[number]

const DISCLAIMER =
  'Verified reference (every claim cited + cross-checked across authoritative sources). Confirm dose against a formulary / clinical judgment before use.'

export const TOOLS = [
  {
    name: 'search_drugs',
    description:
      'Find drugs in the source.cuvetsmo.com verified veterinary catalog by name (English or Thai), Thai brand name, WHO ATC code, therapeutic class, or indication keyword. Use this FIRST whenever you need a slug. Returns compact summaries: slug, nameEn, nameTh, class, classSlug, atc, rxcui, verificationTier, citationCount, url, relevance. Then call get_drug with the slug for clinical detail.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Drug name, brand, ATC code, class, or clinical keyword (e.g. "meloxicam", "NSAID", "M01AC06", "canine seizure").' },
        limit: { type: 'number', description: 'Max results (default 10).' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_drug',
    description:
      'Full verified entry for one drug by slug. By default returns every clinical section — mechanism, indications, contraindications, dosages (per species + route, each with citation ids), sideEffects, interactions, monitoring, storage, pregnancyLactation, citations. Pass `sections` to return only what you need (e.g. ["dosages","citations"]) and save tokens. Every clinical text carries `cites` ids that resolve in the `citations` array; quote them when you repeat a claim. Doses are reference values, not prescriptions.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Drug slug from search_drugs, e.g. "meloxicam", "enrofloxacin", "tmp-smx".' },
        sections: {
          type: 'array',
          items: { type: 'string', enum: [...CONTENT_SECTIONS] },
          description: 'Optional subset of sections to return. Omit for all. Include "citations" whenever you will cite.',
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'get_by_code',
    description:
      'Look up drugs by medical ontology code — WHO ATC (exact like "M01AC06", or a class-level prefix like "J01" for every antibiotic; vet Q-codes such as "QP54AA" work too) or RxNorm CUI. This is the join key that lets other CUVETSMO surfaces (VetMock questions, imaging cases, chat) reference a drug and resolve it back to the verified source entry. Returns summaries plus the resolved ATC name.',
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
      'List every therapeutic class in the catalog with drug counts and browse URLs. Use to orient before searching, or to pick a class for get_by_code prefix queries.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'verify_citation',
    description:
      'Confirm that a citation id on a drug entry exists and report its source URL and whether it is content-addressed (has a CID). Call before repeating a claim to prove it traces to a real authoritative source — the core trust primitive of the data plane.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Drug slug.' },
        citationId: { type: 'string', description: 'Citation id from a `cites` array, e.g. "merck-vet-nsaid", "fda-metacam".' },
      },
      required: ['slug', 'citationId'],
    },
  },
  {
    name: 'catalog_stats',
    description:
      'Data-plane health: total drugs, therapeutic classes, ontology code coverage, verification-tier breakdown, total citations. Use to understand catalog scope before answering "do you cover X" questions.',
    inputSchema: { type: 'object', properties: {} },
  },
]

const ok = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data) }] })
const err = (msg: string) => ({ content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }], isError: true })

// Trim an entry for an LLM consumer: keep clinical content + provenance that
// a reader can act on, drop repo-internal bookkeeping (mirror CIDs, drafting
// metadata, changelog) that only the website / verify tooling needs.
function projectDrug(drug: Drug, sections: readonly SectionName[]) {
  const out: Record<string, unknown> = {
    slug: drug.slug,
    nameEn: drug.nameEn,
    nameTh: drug.nameTh,
    brandNamesTh: drug.brandNamesTh ?? [],
    class: drug.class,
    therapeuticClass: classifyDrug(drug),
    codes: drug.codes ?? {},
    verificationTier: verificationTier(drug),
    reviewedBy: drug.reviewedBy ?? null,
    citationCount: drug.citations.length,
    version: drug.version,
    lastUpdated: drug.lastUpdated,
    sourceUrl: `https://source.cuvetsmo.com/drugs/${drug.slug}`,
    sections,
  }
  for (const s of sections) {
    if (s === 'citations') {
      // cid is null for most citations today — omit the key instead of shipping nulls.
      out.citations = drug.citations.map(({ cid, ...c }) => (cid ? { ...c, cid } : c))
    } else {
      out[s] = drug[s] ?? null
    }
  }
  out.disclaimer = DISCLAIMER
  return out
}

export function createServer(): Server {
  const server = new Server(
    { name: 'cuvetsmo-source', version: PKG_VERSION },
    { capabilities: { tools: {} } },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: rawArgs = {} } = req.params
    const args = rawArgs as Record<string, unknown>
    try {
      switch (name) {
        case 'search_drugs': {
          const q = String(args.query ?? '')
          const limit = Number(args.limit ?? 10)
          if (!q.trim()) return err('query is required')
          const hits = searchDrugs(q, limit)
          return ok({ query: q, count: hits.length, results: hits.map(h => ({ ...summarize(h.drug), relevance: h.score })) })
        }
        case 'get_drug': {
          const slug = String(args.slug ?? '')
          const drug = findBySlug(slug)
          if (!drug) return err(`no drug with slug "${slug}" — use search_drugs to find the right slug`)
          let sections: readonly SectionName[] = CONTENT_SECTIONS
          if (Array.isArray(args.sections)) {
            const wanted = args.sections.filter((s): s is SectionName => (CONTENT_SECTIONS as readonly string[]).includes(String(s)))
            if (wanted.length === 0) return err(`sections must contain one or more of: ${CONTENT_SECTIONS.join(', ')}`)
            sections = wanted
          }
          return ok(projectDrug(drug, sections))
        }
        case 'get_by_code': {
          const system = String(args.system ?? '')
          const code = String(args.code ?? '')
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
          const slug = String(args.slug ?? '')
          const citationId = String(args.citationId ?? '')
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
            serverVersion: PKG_VERSION,
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

  return server
}
