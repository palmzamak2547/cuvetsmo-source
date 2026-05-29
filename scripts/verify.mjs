#!/usr/bin/env node
// scripts/verify.mjs — content integrity gate.
//
// Runs locally (`npm run verify`) and in CI on every PR (.github/
// workflows/verify-content.yml). Exits 1 on any hard failure, exits 0
// on success, prints structured findings to stdout.
//
// Iron Rule 0 enforcement points:
//
//   A.  Schema required fields present
//   B.  Every cite ID in clinical text resolves to a real citation
//   C.  Every citation with a CID resolves to content/citations/<cid>.json
//   D.  Every CID file's `canonical` sub-object hashes back to its filename
//   E.  Every ontology code resolves in our local mirror
//   F.  drafting.aiAssisted → must have aiModel + reasonable humanEditsRatio
//   G.  drafting.humanReviewer is required (no anonymous entries)
//   H.  reviewedBy set → signatures.length > 0 (and vice versa)
//   I.  Canonical entries (reviewed + signed) contain no TEMPLATE markers
//
// Weeks 2+ extensions:
//   - Signature cryptographic verification (Ed25519 against content/keys/)
//   - SNOMED CT / LOINC / ICD-11 lookups against licensed mirrors

import { createHash, createPublicKey, verify as nodeVerify } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// ─── Canonical JSON hashing (mirrors lib/cid.ts) ──────────────────────

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

// Drug content hash excludes signatures[] field (must match lib/sign.ts).
function canonicalContentHash(drug) {
  const { signatures: _drop, ...rest } = drug
  return createHash('sha256').update(canonicalize(rest), 'utf8').digest('hex')
}

// ─── Loaders ──────────────────────────────────────────────────────────

async function loadJSON(p) {
  return JSON.parse(await readFile(p, 'utf8'))
}

async function loadDrugs() {
  const dir = path.join(ROOT, 'content', 'drugs')
  const files = (await readdir(dir)).filter(f => f.endsWith('.json'))
  return Promise.all(files.map(async f => ({
    file: f,
    path: path.join(dir, f),
    data: await loadJSON(path.join(dir, f)),
  })))
}

async function loadCitationFiles() {
  const dir = path.join(ROOT, 'content', 'citations')
  let files
  try {
    files = (await readdir(dir)).filter(f => f.endsWith('.json'))
  } catch {
    return new Map()
  }
  const out = new Map()
  for (const f of files) {
    const cid = f.replace(/\.json$/, '')
    const data = await loadJSON(path.join(dir, f))
    out.set(cid, data)
  }
  return out
}

async function loadOntology() {
  return {
    atc: await loadJSON(path.join(ROOT, 'data', 'ontology', 'atc.json')),
    rxnorm: await loadJSON(path.join(ROOT, 'data', 'ontology', 'rxnorm-vet.json')),
    icd11: await loadJSON(path.join(ROOT, 'data', 'ontology', 'icd11-vet.json')),
    loinc: await loadJSON(path.join(ROOT, 'data', 'ontology', 'loinc-vet.json')),
  }
}

async function loadKeys() {
  // Index of public signing keys, keyed by fingerprint.
  const dir = path.join(ROOT, 'content', 'keys')
  const out = new Map()
  if (!existsSync(dir)) return out
  const files = (await readdir(dir)).filter(f => f.endsWith('.pub.json'))
  for (const f of files) {
    const data = await loadJSON(path.join(dir, f))
    if (data.fingerprint) out.set(data.fingerprint, data)
  }
  return out
}

// ─── Findings collection ──────────────────────────────────────────────

class Findings {
  constructor() {
    this.errors = []
    this.warnings = []
  }
  err(scope, msg) {
    this.errors.push({ scope, msg })
  }
  warn(scope, msg) {
    this.warnings.push({ scope, msg })
  }
  get ok() {
    return this.errors.length === 0
  }
}

// ─── Checks ───────────────────────────────────────────────────────────

const REQUIRED_DRUG_FIELDS = [
  'slug', 'nameEn', 'nameTh', 'class',
  'indications', 'contraindications', 'sideEffects', 'dosages',
  'citations', 'mirroredFrom', 'mirrorCIDs',
  'codes', 'drafting', 'signatures',
  'lastUpdated', 'version',
]

function checkRequiredFields(drug, scope, f) {
  for (const key of REQUIRED_DRUG_FIELDS) {
    if (!(key in drug)) f.err(scope, `missing required field: ${key}`)
  }
}

function collectCiteIds(drug) {
  const ids = new Set()
  const sections = [
    ...(drug.indications ?? []),
    ...(drug.contraindications ?? []),
    ...(drug.sideEffects ?? []),
    ...(drug.interactions ?? []),
    ...(drug.monitoring ?? []),
    ...(drug.storage ?? []),
    ...(drug.pregnancyLactation ?? []),
  ]
  for (const s of sections) (s.cites ?? []).forEach(id => ids.add(id))
  for (const d of drug.dosages ?? []) (d.cites ?? []).forEach(id => ids.add(id))
  return ids
}

function checkCiteRefsResolve(drug, scope, f) {
  const cited = collectCiteIds(drug)
  const known = new Set((drug.citations ?? []).map(c => c.id))
  for (const id of cited) {
    if (!known.has(id)) f.err(scope, `dangling citation reference: "${id}"`)
  }
}

function checkCIDsResolve(drug, scope, f, citationFiles) {
  for (const cit of drug.citations ?? []) {
    if (cit.cid && !citationFiles.has(cit.cid)) {
      f.err(scope, `citation "${cit.id}" claims CID ${cit.cid} but no content/citations/${cit.cid}.json exists`)
    }
  }
  for (const m of drug.mirrorCIDs ?? []) {
    if (!citationFiles.has(m.cid)) {
      f.err(scope, `mirrorCID "${m.cid}" (source ${m.sourceId}) has no content/citations/<cid>.json file`)
    }
  }
}

function checkCIDFilesVerify(citationFiles, f) {
  for (const [cid, file] of citationFiles) {
    if (!file.canonical) {
      f.err(`citations/${cid}.json`, `missing canonical field`)
      continue
    }
    const computed = computeCID(file.canonical)
    if (computed !== cid) {
      f.err(`citations/${cid}.json`, `hash does NOT verify — filename says ${cid}, computed ${computed}`)
    }
    if (file.cid && file.cid !== cid) {
      f.err(`citations/${cid}.json`, `internal cid field "${file.cid}" disagrees with filename "${cid}"`)
    }
  }
}

function checkOntologyCodes(drug, scope, f, ontology) {
  const codes = drug.codes ?? {}
  if (codes.atc) {
    if (!ontology.atc[codes.atc.code]) {
      f.err(scope, `ATC code "${codes.atc.code}" not in local mirror data/ontology/atc.json`)
    } else if (ontology.atc[codes.atc.code].level !== codes.atc.level) {
      f.err(scope, `ATC "${codes.atc.code}" level mismatch — entry says ${codes.atc.level}, registry says ${ontology.atc[codes.atc.code].level}`)
    }
  }
  if (codes.rxnorm) {
    if (!ontology.rxnorm[codes.rxnorm.cui]) {
      f.err(scope, `RxNorm CUI "${codes.rxnorm.cui}" not in local mirror data/ontology/rxnorm-vet.json`)
    }
  }
  if (codes.snomed) f.warn(scope, `SNOMED CT validation skipped (licensing pending)`)
  if (codes.loinc) {
    if (!ontology.loinc[codes.loinc.code]) {
      f.err(scope, `LOINC code "${codes.loinc.code}" not in local mirror data/ontology/loinc-vet.json`)
    }
  }
  if (codes.icd11) {
    if (!ontology.icd11[codes.icd11.code]) {
      f.err(scope, `ICD-11 code "${codes.icd11.code}" not in local mirror data/ontology/icd11-vet.json`)
    }
  }
  if (!codes.atc && !codes.rxnorm && !codes.snomed) {
    f.warn(scope, `no ontology codes — add at least ATC or RxNorm for Iron Rule 0 traceability`)
  }
}

function checkDrafting(drug, scope, f) {
  const d = drug.drafting
  if (!d) {
    f.err(scope, `missing drafting metadata block`)
    return
  }
  if (typeof d.aiAssisted !== 'boolean') {
    f.err(scope, `drafting.aiAssisted must be boolean`)
  }
  if (!d.humanReviewer) {
    f.err(scope, `drafting.humanReviewer required (no anonymous entries — Iron Rule 0)`)
  }
  if (d.aiAssisted) {
    if (!d.aiModel) f.err(scope, `drafting.aiAssisted=true requires aiModel`)
    if (!d.aiPromptHash) f.warn(scope, `drafting.aiAssisted=true should record aiPromptHash`)
    if (typeof d.humanEditsRatio !== 'number' || d.humanEditsRatio < 0.1) {
      f.err(scope, `drafting.humanEditsRatio < 0.1 — AI draft not meaningfully edited by human (Iron Rule 0)`)
    }
  }
}

function checkSignatureConsistency(drug, scope, f) {
  const isReviewed = drug.reviewedBy !== null
  const hasSigs = (drug.signatures ?? []).length > 0
  if (isReviewed && !hasSigs) {
    f.err(scope, `reviewedBy is set but signatures[] is empty — canonical entries must be signed`)
  }
  if (!isReviewed && hasSigs) {
    f.warn(scope, `signatures[] is non-empty but reviewedBy is null — infrastructure-only signature, NOT canonical`)
  }
}

function checkSignatureCrypto(drug, scope, f, keys) {
  const sigs = drug.signatures ?? []
  if (sigs.length === 0) return
  const expectedHash = canonicalContentHash(drug)
  for (let i = 0; i < sigs.length; i++) {
    const s = sigs[i]
    const sigScope = `${scope} sig[${i}] (${s.signerId})`

    // 1. The signature record's contentHash must match the entry's actual canonical hash.
    if (s.contentHash !== expectedHash) {
      f.err(sigScope, `contentHash mismatch — record claims ${s.contentHash.slice(0, 16)}… but entry hashes to ${expectedHash.slice(0, 16)}…`)
      continue
    }

    // 2. We must know the public key by fingerprint.
    const pubKey = keys.get(s.signerKeyId)
    if (!pubKey) {
      f.err(sigScope, `unknown signerKeyId "${s.signerKeyId}" — no matching public key in content/keys/`)
      continue
    }

    // 3. The signature must verify cryptographically.
    try {
      const cleanKey = { kty: pubKey.kty, crv: pubKey.crv, x: pubKey.x }
      const keyObj = createPublicKey({ key: cleanKey, format: 'jwk' })
      const ok = nodeVerify(
        null,
        Buffer.from(s.contentHash, 'hex'),
        keyObj,
        Buffer.from(s.signature, 'base64'),
      )
      if (!ok) {
        f.err(sigScope, `signature FAILS Ed25519 verify against key ${s.signerKeyId}`)
      }
    } catch (err) {
      f.err(sigScope, `signature verify threw: ${err.message ?? err}`)
    }
  }
}

// Iron Rule 0 (source-traceability): every REAL clinical claim must cite at
// least one authoritative source. TEMPLATE placeholders are exempt (they are
// honestly marked as pending). This is the core trust gate for a cited
// reference work — content authority comes from the cited sources, not from
// whoever compiled the entry.
function checkSourceTraceability(drug, scope, f) {
  const isTemplate = (s) => typeof s === 'string' && /TEMPLATE/i.test(s)
  const namedSections = [
    ['indications', drug.indications],
    ['contraindications', drug.contraindications],
    ['sideEffects', drug.sideEffects],
    ['interactions', drug.interactions],
    ['monitoring', drug.monitoring],
    ['storage', drug.storage],
    ['pregnancyLactation', drug.pregnancyLactation],
  ]
  for (const [name, arr] of namedSections) {
    for (const s of arr ?? []) {
      if (isTemplate(s.text)) continue // pending placeholder — exempt
      if (!Array.isArray(s.cites) || s.cites.length === 0) {
        f.err(scope, `${name} claim has no citation — every real clinical statement must cite an authoritative source (Iron Rule 0)`)
      }
    }
  }
  for (const dose of drug.dosages ?? []) {
    if (isTemplate(dose.dose)) continue
    if (!Array.isArray(dose.cites) || dose.cites.length === 0) {
      f.err(scope, `dosage (${dose.species}) has no citation — every real dose must cite an authoritative source (Iron Rule 0)`)
    }
  }
}

function checkTemplateMarkers(drug, scope, f) {
  if (drug.reviewedBy === null) return // template content is fine for pending entries
  const sections = [
    ...(drug.indications ?? []),
    ...(drug.contraindications ?? []),
    ...(drug.sideEffects ?? []),
    ...(drug.interactions ?? []),
    ...(drug.monitoring ?? []),
    ...(drug.storage ?? []),
    ...(drug.pregnancyLactation ?? []),
  ]
  for (const s of sections) {
    if (typeof s.text === 'string' && /TEMPLATE/i.test(s.text)) {
      f.err(scope, `canonical entry contains TEMPLATE placeholder — strip before publishing`)
      return
    }
  }
  for (const d of drug.dosages ?? []) {
    if (typeof d.dose === 'string' && /TEMPLATE/i.test(d.dose)) {
      f.err(scope, `canonical entry has TEMPLATE in dosage row — strip before publishing`)
      return
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────

const findings = new Findings()
const drugs = await loadDrugs()
const citationFiles = await loadCitationFiles()
const ontology = await loadOntology()
const keys = await loadKeys()

// First: verify the citation files themselves before checking refs into them.
checkCIDFilesVerify(citationFiles, findings)

for (const { file, data } of drugs) {
  const scope = `drugs/${file}`
  checkRequiredFields(data, scope, findings)
  checkCiteRefsResolve(data, scope, findings)
  checkCIDsResolve(data, scope, findings, citationFiles)
  checkOntologyCodes(data, scope, findings, ontology)
  checkDrafting(data, scope, findings)
  checkSignatureConsistency(data, scope, findings)
  checkSignatureCrypto(data, scope, findings, keys)
  checkTemplateMarkers(data, scope, findings)
  checkSourceTraceability(data, scope, findings)
}

// ─── Report ───────────────────────────────────────────────────────────

const total = drugs.length + citationFiles.size
const sigCount = drugs.reduce((n, d) => n + (d.data.signatures?.length ?? 0), 0)
console.log('')
console.log(`source.cuvetsmo.com — content integrity check`)
console.log(`  drugs:     ${drugs.length}`)
console.log(`  citations: ${citationFiles.size}`)
console.log(`  ontology:  ${Object.keys(ontology.atc).length} ATC, ${Object.keys(ontology.rxnorm).length} RxNorm, ${Object.keys(ontology.icd11).length} ICD-11, ${Object.keys(ontology.loinc).length} LOINC`)
console.log(`  keys:      ${keys.size}`)
console.log(`  signatures: ${sigCount}`)
console.log('')

if (findings.warnings.length > 0) {
  console.log(`warnings (${findings.warnings.length}):`)
  for (const w of findings.warnings) console.log(`  · ${w.scope}: ${w.msg}`)
  console.log('')
}

if (findings.errors.length > 0) {
  console.log(`ERRORS (${findings.errors.length}):`)
  for (const e of findings.errors) console.log(`  ✗ ${e.scope}: ${e.msg}`)
  console.log('')
  console.log(`FAIL — ${findings.errors.length} hard failure(s) across ${total} content unit(s).`)
  process.exit(1)
}

console.log(`OK — ${total} content unit(s) pass Iron Rule 0 integrity checks.`)
