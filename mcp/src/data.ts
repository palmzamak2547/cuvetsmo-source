// Data layer for the cuvetsmo-source MCP server.
//
// CRITICAL DESIGN RULE: the MCP server reads the SAME on-disk files the
// website builds from — content/drugs/*.json + data/ontology/*.json. There
// is exactly one source of truth. The MCP does not maintain its own copy,
// its own database, or its own fork of the content. If a drug entry changes
// in the repo, the next MCP process start reflects it. This is what makes
// `source` a data *plane* (one truth, many surfaces) rather than N copies.
//
// The verificationTier + therapeutic-class logic below intentionally MIRRORS
// lib/drugs.ts + lib/classify.ts. It is duplicated (not imported) only because
// the website is a CommonJS/Next module graph behind the `@/` alias and this
// MCP is a standalone ESM package; importing across that boundary would couple
// the MCP build to Next. The logic is small and stable. If lib/classify.ts
// gains a class, mirror it here (a smoke test guards the drift — see smoke.ts).

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
// Data resolution — two modes over ONE source of truth:
//   • In-repo dev:  read the live repo files (content/drugs, data/ontology).
//     Edit a drug -> next server start reflects it. No copy, no drift.
//   • Published npm: the repo files aren't present, so read a frozen snapshot
//     bundled at publish time into mcp/_data/ (see prepublishOnly in
//     package.json — it copies content/drugs + data/ontology into _data/).
// The snapshot is a point-in-time freeze of the same truth; republish to
// refresh, or run the HTTP transport against the always-current repo in dev.
const MCP_ROOT = resolve(__dirname, '..')          // dist/ -> mcp/
const REPO_ROOT = resolve(MCP_ROOT, '..')          // mcp/  -> repo root
const SNAPSHOT = join(MCP_ROOT, '_data')           // bundled in published pkg
const usingSnapshot = existsSync(join(SNAPSHOT, 'drugs'))
const DRUGS_DIR = usingSnapshot ? join(SNAPSHOT, 'drugs') : join(REPO_ROOT, 'content', 'drugs')
const ONTOLOGY_DIR = usingSnapshot ? join(SNAPSHOT, 'ontology') : join(REPO_ROOT, 'data', 'ontology')

export type Drug = {
  slug: string
  nameEn: string
  nameTh: string
  class: string
  mechanism?: string
  brandNamesTh?: string[]
  indications: { text: string; cites: string[] }[]
  contraindications: { text: string; cites: string[] }[]
  sideEffects: { text: string; cites: string[] }[]
  dosages: { species: string; indication: string; route: string; dose: string; duration?: string; notes?: string; cites: string[] }[]
  interactions?: { text: string; cites: string[] }[]
  monitoring?: { text: string; cites: string[] }[]
  citations: { id: string; type: string; title: string; url?: string; year?: number; note?: string; cid?: string | null }[]
  codes: {
    atc?: { code: string; name: string; level: number }
    rxnorm?: { cui: string; name: string }
    icd11?: { code: string; name: string }
    loinc?: { code: string; name: string }
  }
  signatures: unknown[]
  reviewedBy: unknown | null
  attestations?: unknown[]
  version: number
  lastUpdated: string
}

export type VerificationTier = 'verified' | 'community' | 'expert'

// ── load all drugs once at process start ──────────────────────────────
function loadDrugs(): Drug[] {
  const files = readdirSync(DRUGS_DIR).filter(f => f.endsWith('.json'))
  return files
    .map(f => JSON.parse(readFileSync(join(DRUGS_DIR, f), 'utf8')) as Drug)
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn))
}

export const DRUGS: Drug[] = loadDrugs()

// ── ontology mirrors (for resolving codes -> human names) ─────────────
type AtcEntry = { code: string; name: string; level: number; parent: string }
export const ATC: Record<string, AtcEntry> = JSON.parse(readFileSync(join(ONTOLOGY_DIR, 'atc.json'), 'utf8'))
export const RXNORM: Record<string, { cui: string; name: string }> = JSON.parse(readFileSync(join(ONTOLOGY_DIR, 'rxnorm-vet.json'), 'utf8'))

// ── verification tier (mirrors lib/drugs.ts) ──────────────────────────
// Web UI surfaces a single headline tier "◆ Verified" (every entry is cited +
// cross-checked). The expert/community rungs remain in the schema as dormant
// future hooks. The MCP reports the literal computed tier so downstream agents
// can filter if they ever populate those rungs.
const MIN_COMMUNITY_ATTESTATIONS = 2
export function verificationTier(d: Drug): VerificationTier {
  if (d.reviewedBy !== null && (d.signatures?.length ?? 0) > 0) return 'expert'
  if ((d.attestations?.length ?? 0) >= MIN_COMMUNITY_ATTESTATIONS) return 'community'
  return 'verified'
}

// ── therapeutic class (mirrors lib/classify.ts ordering + Q-strip) ────
const stripQ = (code: string) => (code.startsWith('Q') ? code.slice(1) : code)
const CLASS_RULES: { slug: string; label: string; prefixes: string[] }[] = [
  { slug: 'nsaids', label: 'NSAIDs', prefixes: ['M01A'] },
  { slug: 'opioids', label: 'Opioids', prefixes: ['N02A', 'N07BC'] },
  { slug: 'anesthetics-sedatives', label: 'Anesthetics & sedatives', prefixes: ['N01', 'N05A', 'N05B', 'N05C'] },
  { slug: 'antibiotics', label: 'Antibiotics', prefixes: ['J01', 'P01AB'] },
  { slug: 'antifungals', label: 'Antifungals', prefixes: ['J02', 'D01'] },
  { slug: 'antiparasitics', label: 'Antiparasitics', prefixes: ['P02', 'P51', 'P53', 'P54'] },
  { slug: 'gi', label: 'GI', prefixes: ['A02', 'A03', 'A06'] },
  { slug: 'anti-emetics', label: 'Anti-emetics', prefixes: ['A04'] },
  { slug: 'antihistamines', label: 'Antihistamines', prefixes: ['R06'] },
  // urinary MUST precede cardiovascular: C04AX starts with C0 (mirror lib/classify.ts order)
  { slug: 'urinary', label: 'Urinary & micturition', prefixes: ['N07AB', 'C04AX', 'G04B'] },
  { slug: 'cardiovascular', label: 'Cardiovascular', prefixes: ['C0'] },
  { slug: 'endocrine', label: 'Endocrine', prefixes: ['H03'] },
  { slug: 'adrenal', label: 'Adrenal', prefixes: ['H02CA', 'H02AA', 'V03AB99'] },
  { slug: 'corticosteroids', label: 'Corticosteroids', prefixes: ['H02'] },
  { slug: 'anticonvulsants', label: 'Anticonvulsants', prefixes: ['N03'] },
  { slug: 'diabetes', label: 'Diabetes', prefixes: ['A10'] },
  { slug: 'hematology', label: 'Hematology', prefixes: ['B01'] },
  { slug: 'antidotes', label: 'Antidotes', prefixes: ['V03', 'B02BA'] },
  { slug: 'muscle-relaxants', label: 'Muscle relaxants', prefixes: ['M03'] },
  { slug: 'immunomodulators', label: 'Immunomodulators', prefixes: ['L04'] },
  { slug: 'cns-psychotropic', label: 'CNS / psychotropic', prefixes: ['N06'] },
  { slug: 'respiratory', label: 'Respiratory', prefixes: ['R03', 'R07'] },
  { slug: 'emergency-cardiac', label: 'Emergency & cardiac stimulants', prefixes: ['C01CA'] },
  { slug: 'fluids-electrolytes', label: 'Fluids & electrolytes', prefixes: ['B05', 'A12', 'V06D'] },
  { slug: 'toxicology-emesis', label: 'Toxicology & emesis', prefixes: ['A07BA', 'V03AB25', 'V03AB07', 'N04BC'] },
  { slug: 'pituitary-hormones', label: 'Pituitary hormones', prefixes: ['H01B'] },
  { slug: 'antineoplastics', label: 'Antineoplastics', prefixes: ['L01'] },
  { slug: 'ophthalmology', label: 'Ophthalmology', prefixes: ['S01'] },
  { slug: 'dermatology', label: 'Dermatology', prefixes: ['D11'] },
  { slug: 'antivirals', label: 'Antivirals', prefixes: ['J05'] },
  { slug: 'hepatobiliary', label: 'Hepatobiliary', prefixes: ['A05'] },
  { slug: 'metabolic-nutritional', label: 'Metabolic & nutritional', prefixes: ['A16'] },
  { slug: 'hematopoietic', label: 'Hematopoietic', prefixes: ['B03'] },
  { slug: 'antiseptics', label: 'Antiseptics & topical antimicrobials', prefixes: ['D08', 'D06'] },
  { slug: 'reproductive', label: 'Reproductive & sex hormones', prefixes: ['G02', 'G03', 'G04C', 'H01CA'] },
]
export function classifyDrug(d: Drug): { slug: string; label: string } | null {
  const code = stripQ(d.codes?.atc?.code ?? '')
  if (!code) return null
  for (const r of CLASS_RULES) if (r.prefixes.some(p => code.startsWith(p))) return { slug: r.slug, label: r.label }
  return null
}

// ── lookups ───────────────────────────────────────────────────────────
export function findBySlug(slug: string): Drug | undefined {
  return DRUGS.find(d => d.slug === slug.toLowerCase())
}

export function findByAtc(code: string): Drug[] {
  const q = code.toUpperCase()
  return DRUGS.filter(d => {
    const a = d.codes?.atc?.code?.toUpperCase()
    return a === q || (a && a.startsWith(q)) // exact or prefix (class-level query)
  })
}

export function findByRxcui(cui: string): Drug[] {
  return DRUGS.filter(d => d.codes?.rxnorm?.cui === cui)
}

// Lightweight relevance search across name (EN/TH), brand, class, indication.
export function searchDrugs(query: string, limit = 10): { drug: Drug; score: number }[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const terms = q.split(/\s+/)
  const scored = DRUGS.map(d => {
    const hay = [
      d.nameEn, d.nameTh, d.class,
      ...(d.brandNamesTh ?? []),
      d.codes?.atc?.code ?? '',
      d.codes?.rxnorm?.cui ?? '',
      ...d.indications.map(i => i.text),
    ].join(' ').toLowerCase()
    let score = 0
    for (const t of terms) {
      if (d.nameEn.toLowerCase() === t || d.slug === t) score += 100
      else if (d.nameEn.toLowerCase().startsWith(t)) score += 50
      else if (d.nameEn.toLowerCase().includes(t)) score += 25
      else if ((d.codes?.atc?.code ?? '').toLowerCase().includes(t)) score += 40
      else if (hay.includes(t)) score += 10
    }
    return { drug: d, score }
  })
  return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit)
}

// Verify a citation exists + report whether it carries a content-addressed CID.
export function verifyCitation(drugSlug: string, citationId: string) {
  const drug = findBySlug(drugSlug)
  if (!drug) return { found: false, reason: `no drug with slug "${drugSlug}"` }
  const cite = drug.citations.find(c => c.id === citationId)
  if (!cite) return { found: false, reason: `drug "${drugSlug}" has no citation id "${citationId}"`, availableIds: drug.citations.map(c => c.id) }
  return {
    found: true,
    citation: cite,
    contentAddressed: !!cite.cid,
    sourceUrl: cite.url ?? null,
  }
}

// Compact projection for list/search results (avoid dumping full entries).
export function summarize(d: Drug) {
  const klass = classifyDrug(d)
  return {
    slug: d.slug,
    nameEn: d.nameEn,
    nameTh: d.nameTh,
    class: d.class,
    classSlug: klass?.slug ?? null,
    atc: d.codes?.atc?.code ?? null,
    rxcui: d.codes?.rxnorm?.cui ?? null,
    verificationTier: verificationTier(d),
    citationCount: d.citations.length,
    url: `https://source.cuvetsmo.com/drugs/${d.slug}`,
  }
}
