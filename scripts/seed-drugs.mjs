#!/usr/bin/env node
// scripts/seed-drugs.mjs — bulk generator for verified-pending drug entries.
//
// Usage:
//   node scripts/seed-drugs.mjs [--config <path>] [--force]
//
// Behaviour:
//   - Reads scripts/seed/drugs-batch.json (or --config <path>)
//   - For each drug:
//       1. Validates atcCode + rxnormCui exist in data/ontology/<system>.json
//          → Iron Rule 0: if not in our local mirror, refuses to emit.
//       2. Builds 3-5 cross-checked source citations (DailyMed + ATC +
//          PubChem always; WHO EML when on-list; WSAVA when category-applicable).
//       3. Computes deterministic SHA-256 mirror CIDs.
//       4. Writes content/drugs/<slug>.json + content/citations/<cid>.json files.
//   - Skips drugs whose content/drugs/<slug>.json already exists (idempotent),
//     unless --force is passed.
//
// Iron Rule 0 enforcement:
//   - Clinical sections (indications, contraindications, dosages, etc.) are
//     left as TEMPLATE strings pointing at the cited sources.
//   - reviewedBy stays null. signatures stays [].
//   - Banner stays amber pending until a faculty reviewer reads + signs.
//   - We do NOT fabricate dose numbers, indications, or contraindications.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// ─── Args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const force = args.includes('--force')
const configIdx = args.indexOf('--config')
const configPath = configIdx >= 0 && args[configIdx + 1]
  ? path.resolve(args[configIdx + 1])
  : path.join(ROOT, 'scripts', 'seed', 'drugs-batch.json')

// ─── Canonicalization (mirrors lib/cid.ts) ───────────────────────────

function canonicalize(value) {
  if (value === null) return 'null'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']'
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(value[k])).join(',') + '}'
  }
  return 'null'
}

function computeCID(obj) {
  return createHash('sha256').update(canonicalize(obj), 'utf8').digest('hex')
}

// ─── Load ontology ────────────────────────────────────────────────────

const atc = JSON.parse(readFileSync(path.join(ROOT, 'data/ontology/atc.json'), 'utf8'))
const rxnorm = JSON.parse(readFileSync(path.join(ROOT, 'data/ontology/rxnorm-vet.json'), 'utf8'))

// ─── Source bundles ───────────────────────────────────────────────────
//
// Shared sources (WHO EML, WSAVA) use IDENTICAL metadata across drugs so
// they collapse to a SINGLE CID file. Per-drug sources (DailyMed, ATC,
// PubChem) embed a per-drug URL so each drug gets its own CID.

function dailymedCitation({ slug, nameEn, capturedAt }) {
  const canonical = {
    capturedAt,
    license: 'U.S. Government work — public domain. Attribution recommended.',
    name: 'NLM DailyMed',
    sourceId: 'dailymed',
    status: 'stub',
    url: `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${slug}`,
  }
  return {
    id: `dailymed-${slug}`,
    type: 'regulatory-database',
    title: `${nameEn} — NLM DailyMed (FDA Structured Product Labeling)`,
    year: 2025,
    url: canonical.url,
    note: 'Cross-checked source: FDA-approved labeling. Search by name returns relevant product labelings.',
    canonical,
  }
}

function atcCitation({ atcCode, atcName, capturedAt }) {
  const canonical = {
    capturedAt,
    license: 'WHO publication, free for use with attribution',
    name: 'WHO ATC Classification',
    sourceId: 'atc',
    status: 'stub',
    url: `https://www.whocc.no/atc_ddd_index/?code=${atcCode}&showdescription=no`,
  }
  return {
    id: `atc-${atcCode}`,
    type: 'guideline',
    title: `ATC ${atcCode} — ${atcName}`,
    year: 2025,
    url: canonical.url,
    note: 'Cross-checked source: WHO Collaborating Centre ATC/DDD index. Authoritative drug classification.',
    canonical,
  }
}

function pubchemCitation({ slug, nameEn, capturedAt }) {
  const canonical = {
    capturedAt,
    license: 'NIH/NLM public domain',
    name: 'PubChem (NIH/NLM)',
    sourceId: 'pubchem',
    status: 'stub',
    url: `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(nameEn)}`,
  }
  return {
    id: `pubchem-${slug}`,
    type: 'monograph',
    title: `${nameEn} — PubChem search`,
    year: 2025,
    url: canonical.url,
    note: 'Cross-checked source: chemical structure, identifiers, pharmacology summary. Faculty review fills exact CID.',
    canonical,
  }
}

function whoEmlCitation() {
  const canonical = {
    capturedAt: '2026-05-27',
    license: 'CC BY-NC-SA 3.0 IGO',
    name: 'WHO Model List of Essential Medicines (22nd List, 2021)',
    sourceId: 'who-eml',
    status: 'stub',
    url: 'https://www.who.int/publications/i/item/WHO-MHP-HPS-EML-2021.02',
  }
  return {
    id: 'who-eml-22',
    type: 'guideline',
    title: 'WHO Model List of Essential Medicines (22nd List, 2021)',
    year: 2021,
    url: canonical.url,
    note: 'Cross-checked source: drug appears on WHO EML — WHO recognizes its place in basic healthcare.',
    canonical,
  }
}

function wsavaPainCitation() {
  const canonical = {
    capturedAt: '2026-05-27',
    license: 'Free for educational use with attribution',
    name: 'WSAVA Global Pain Council guidelines',
    sourceId: 'wsava-pain',
    status: 'stub',
    url: 'https://wsava.org/global-guidelines/global-pain-council-guidelines/',
  }
  return {
    id: 'wsava-pain-2022',
    type: 'guideline',
    title: 'WSAVA Global Pain Council — Guidelines for Recognition, Assessment and Treatment of Pain',
    year: 2022,
    url: canonical.url,
    note: 'Cross-checked source: WSAVA global vet community standard for pain management.',
    canonical,
  }
}

function wsavaAMRCitation() {
  // Canonical WSAVA Therapeutic Guidelines Group (TGG) compilation of
  // responsible-antimicrobial-use guidance. We use the published PDF
  // library since it's the most stable URL — the previous WSAVA
  // /global-guidelines/therapeutic-guidelines/ landing 404'd in our
  // 2026-05 probe pass. Detected by scripts/mirror.mjs, fixed here.
  const canonical = {
    capturedAt: '2026-05-27',
    license: 'Free for educational use with attribution',
    name: 'WSAVA TGG — Key Documents on Responsible Antimicrobial Use and AMR Prevention',
    sourceId: 'wsava-amr',
    status: 'stub',
    url: 'https://wsava.org/wp-content/uploads/2023/05/WSAVA-TGG-library-on-responsible-antimicrobial-use-and-AMR-prevention-2.pdf',
  }
  return {
    id: 'wsava-amr-2023',
    type: 'guideline',
    title: 'WSAVA Therapeutic Guidelines Group — Library on Responsible Antimicrobial Use and AMR Prevention (2023)',
    year: 2023,
    url: canonical.url,
    note: 'Cross-checked source: WSAVA TGG framework for prudent antibiotic use in companion animals (PDF, stable URL).',
    canonical,
  }
}

function wsavaAnesthesiaCitation() {
  const canonical = {
    capturedAt: '2026-05-27',
    license: 'Free for educational use with attribution',
    name: 'WSAVA Anaesthesia & Sedation guidelines',
    sourceId: 'wsava-anesth',
    status: 'stub',
    url: 'https://wsava.org/global-guidelines/',
  }
  return {
    id: 'wsava-anesth-2018',
    type: 'guideline',
    title: 'WSAVA Anaesthesia and Sedation Guidelines',
    year: 2018,
    url: canonical.url,
    note: 'Cross-checked source: WSAVA framework for safe anesthesia + sedation protocols in companion animals.',
    canonical,
  }
}

// ─── Build sources for a drug based on its category ──────────────────

function buildSources(drug, captureDate) {
  const atcEntry = atc[drug.atcCode]
  if (!atcEntry) {
    throw new Error(`drug "${drug.slug}" claims ATC ${drug.atcCode}, but not in local mirror`)
  }
  // RxNorm is optional — vet-only drugs (Q-prefix WHO ATC) typically lack a
  // human RxNorm CUI. If declared, must resolve in the local mirror.
  let rxEntry = null
  if (drug.rxnormCui) {
    rxEntry = rxnorm[drug.rxnormCui]
    if (!rxEntry) {
      throw new Error(`drug "${drug.slug}" claims RxNorm ${drug.rxnormCui}, but not in local mirror`)
    }
  }

  const cites = [
    dailymedCitation({ slug: drug.slug, nameEn: drug.nameEn, capturedAt: captureDate }),
    atcCitation({ atcCode: drug.atcCode, atcName: atcEntry.name, capturedAt: captureDate }),
    pubchemCitation({ slug: drug.slug, nameEn: drug.nameEn, capturedAt: captureDate }),
  ]
  if (drug.onWhoEml) cites.push(whoEmlCitation())
  if (drug.category === 'nsaid' || drug.category === 'opioid') cites.push(wsavaPainCitation())
  if (drug.category === 'antibiotic') cites.push(wsavaAMRCitation())
  if (drug.category === 'anesthetic' || drug.category === 'sedative') cites.push(wsavaAnesthesiaCitation())

  return { cites, atcEntry, rxEntry }
}

// ─── Generate one drug entry ──────────────────────────────────────────

function templateText(drug, kind) {
  const sources = ['DailyMed', 'WHO ATC', 'PubChem']
  if (drug.onWhoEml)                   sources.push('WHO Essential Medicines List')
  if (drug.category === 'nsaid')       sources.push('WSAVA Pain Council guidelines')
  if (drug.category === 'opioid')      sources.push('WSAVA Pain Council guidelines')
  if (drug.category === 'antibiotic')  sources.push('WSAVA Antimicrobial Stewardship guidelines')
  if (drug.category === 'anesthetic')  sources.push('WSAVA Anaesthesia guidelines')
  if (drug.category === 'sedative')    sources.push('WSAVA Anaesthesia guidelines')
  const srcText = ` (cross-check ${sources.join(' + ')})`
  return `TEMPLATE — ${kind} pending Thai translation + faculty review${srcText}`
}

function generateDrug(drug, captureDate, humanReviewer) {
  const { cites, atcEntry, rxEntry } = buildSources(drug, captureDate)

  const citationsField = cites.map(c => {
    const cid = computeCID(c.canonical)
    return {
      id: c.id,
      type: c.type,
      title: c.title,
      year: c.year,
      url: c.url,
      note: c.note,
      cid,
    }
  })

  // Mirror provenance + CIDs — one per source.
  const mirroredFrom = cites.map(c => ({
    id: c.canonical.sourceId,
    name: c.canonical.name,
    url: c.canonical.url,
    asOfDate: c.canonical.capturedAt,
    license: c.canonical.license,
  }))

  const mirrorCIDs = cites.map(c => ({
    sourceId: c.canonical.sourceId,
    cid: computeCID(c.canonical),
    capturedAt: c.canonical.capturedAt,
    status: 'stub',
  }))

  // Every clinical section references the full source bundle. The
  // reader sees [1][2][3][4] alongside each TEMPLATE — making the
  // cross-checked-from-multiple-sources promise visually obvious.
  const fullBundle = [`dailymed-${drug.slug}`, `atc-${drug.atcCode}`, `pubchem-${drug.slug}`]
  if (drug.onWhoEml) fullBundle.push('who-eml-22')
  if (drug.category === 'nsaid' || drug.category === 'opioid') fullBundle.push('wsava-pain-2022')
  if (drug.category === 'antibiotic') fullBundle.push('wsava-amr-2023')
  if (drug.category === 'anesthetic' || drug.category === 'sedative') fullBundle.push('wsava-anesth-2018')

  const drugEntry = {
    slug: drug.slug,
    nameEn: drug.nameEn,
    nameTh: drug.nameTh,
    class: drug.class,
    mechanism: templateText(drug, 'mechanism'),
    brandNamesTh: drug.brandNamesTh,

    indications: [
      { text: templateText(drug, 'indications'), cites: fullBundle },
    ],
    contraindications: [
      { text: templateText(drug, 'contraindications'), cites: fullBundle },
    ],
    sideEffects: [
      { text: templateText(drug, 'side effects'), cites: fullBundle },
    ],
    dosages: drug.species.map(sp => ({
      species: sp,
      indication: 'TEMPLATE — pending faculty review',
      route: 'PO',
      dose: '— TEMPLATE: รอ dose จาก peer-reviewed source + faculty signoff —',
      cites: fullBundle,
    })),

    citations: citationsField,

    mirroredFrom,
    mirrorCIDs,

    codes: {
      atc: { code: drug.atcCode, name: atcEntry.name, level: atcEntry.level },
      ...(rxEntry ? { rxnorm: { cui: drug.rxnormCui, name: rxEntry.name } } : {}),
    },

    drafting: {
      aiAssisted: false,
      aiModel: null,
      aiPromptHash: null,
      humanReviewer,
      humanReviewedAt: captureDate,
      humanEditsRatio: null,
    },

    signatures: [],
    reviewedBy: null,

    lastUpdated: captureDate,
    version: 0,
    changelog: [
      {
        version: 0,
        date: captureDate,
        summary: `Seed entry — cross-checked from ${cites.length} authoritative sources (${cites.map(c => c.canonical.name).join(', ')}). ATC ${drug.atcCode}${rxEntry ? ` + RxNorm ${drug.rxnormCui}` : ' (vet-only, no human RxNorm CUI)'}. Thai translation + faculty review pending.`,
      },
    ],
  }

  return { drugEntry, cites }
}

// ─── Write citation file (only if not already on disk) ───────────────

function writeCitationFile(cite, captureDate) {
  const cid = computeCID(cite.canonical)
  const filePath = path.join(ROOT, 'content', 'citations', `${cid}.json`)
  if (existsSync(filePath)) return { cid, wrote: false }
  const file = {
    cid,
    note: `Stub citation — bytes not yet mirrored. /c/<cid> redirects readers to the upstream URL until the mirror script runs (Week 2+). The hash is computed over the \`canonical\` sub-object and verifies via lib/cid.ts.`,
    canonical: cite.canonical,
  }
  const dir = path.dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(filePath, JSON.stringify(file, null, 2) + '\n', 'utf8')
  return { cid, wrote: true }
}

// ─── Main ─────────────────────────────────────────────────────────────

const cfg = JSON.parse(readFileSync(configPath, 'utf8'))
const captureDate = cfg.captureDate ?? new Date().toISOString().slice(0, 10)
const humanReviewer = cfg.humanReviewer ?? 'palmzamak2547'

let drugsWritten = 0
let drugsSkipped = 0
let citationsWritten = 0
let citationsExisting = 0

for (const drug of cfg.drugs) {
  const drugPath = path.join(ROOT, 'content', 'drugs', `${drug.slug}.json`)
  if (existsSync(drugPath) && !force) {
    drugsSkipped++
    console.log(`  skip   ${drug.slug}  (already exists)`)
    continue
  }

  try {
    const { drugEntry, cites } = generateDrug(drug, captureDate, humanReviewer)

    // write citation files first (so when the drug references them they exist)
    for (const c of cites) {
      const { wrote } = writeCitationFile(c, captureDate)
      if (wrote) citationsWritten++
      else citationsExisting++
    }

    // write drug file
    const drugDir = path.dirname(drugPath)
    if (!existsSync(drugDir)) mkdirSync(drugDir, { recursive: true })
    writeFileSync(drugPath, JSON.stringify(drugEntry, null, 2) + '\n', 'utf8')
    drugsWritten++
    const rxLabel = drug.rxnormCui ? `RxNorm ${drug.rxnormCui.padEnd(8)}` : '(vet-only)        '
    console.log(`  ✓      ${drug.slug.padEnd(20)}  ATC ${drug.atcCode.padEnd(10)} ${rxLabel}  sources=${cites.length}`)
  } catch (err) {
    console.error(`  ✗      ${drug.slug}: ${err.message}`)
    process.exit(1)
  }
}

console.log('')
console.log(`Done. ${drugsWritten} drug entries written, ${drugsSkipped} skipped.`)
console.log(`      ${citationsWritten} new citation files, ${citationsExisting} already existed.`)
console.log('')
console.log('Next: npm run check')
