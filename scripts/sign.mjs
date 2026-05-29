#!/usr/bin/env node
// scripts/sign.mjs — sign a drug entry with an Ed25519 private key.
//
// Usage:
//   node scripts/sign.mjs <slug> --signer <kid> [--signer-name "Name"]
//                                [--signer-id "stable.id"]
//
// Example:
//   node scripts/sign.mjs meloxicam --signer cuvetsmo-board
//
// Effects:
//   1. Loads content/drugs/<slug>.json
//   2. Strips signatures[] from the canonical view
//   3. Computes SHA-256 of canonical JSON
//   4. Signs the hash with ~/.cuvetsmo-keys/<kid>.priv.json
//   5. Appends a new signature record to drug.signatures[]
//   6. Writes the drug JSON back
//   7. Appends a transparency log entry to content/log/transparency-log.jsonl
//
// Iron Rule 0:
//   - Does NOT touch reviewedBy. Setting reviewedBy is a separate human
//     decision representing clinical-accountability signoff. Signing
//     alone proves cryptographic integrity, not clinical correctness.
//   - Refuses to sign if the drug has been signed by this signer before
//     for the current contentHash (idempotent — re-signing is a no-op).

import { createHash, createPrivateKey, sign as nodeSign } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// ─── Args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
if (args.length < 1 || args[0].startsWith('-')) {
  console.error('Usage: node scripts/sign.mjs <slug> --signer <kid> [--signer-name "Name"] [--signer-id "id"]')
  process.exit(1)
}
const slug = args[0]
function getFlag(name) {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}
const kid = getFlag('--signer')
if (!kid) {
  console.error('error: --signer <kid> required')
  process.exit(1)
}
const signerNameOverride = getFlag('--signer-name')
const signerIdOverride = getFlag('--signer-id')

// ─── Canonicalize (mirrors lib/cid.ts + lib/sign.ts) ─────────────────

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

function canonicalContentHash(drug) {
  const { signatures: _drop, ...rest } = drug
  return createHash('sha256').update(canonicalize(rest), 'utf8').digest('hex')
}

// ─── Load drug + key ──────────────────────────────────────────────────

const drugPath = path.join(ROOT, 'content', 'drugs', `${slug}.json`)
if (!existsSync(drugPath)) {
  console.error(`error: no drug at ${drugPath}`)
  process.exit(1)
}
const drug = JSON.parse(readFileSync(drugPath, 'utf8'))

const pubKeyPath = path.join(ROOT, 'content', 'keys', `${kid}.pub.json`)
const privKeyPath = path.join(os.homedir(), '.cuvetsmo-keys', `${kid}.priv.json`)
if (!existsSync(pubKeyPath)) {
  console.error(`error: no public key at ${pubKeyPath}`)
  console.error(`       run: node scripts/keygen.mjs ${kid}`)
  process.exit(1)
}
if (!existsSync(privKeyPath)) {
  console.error(`error: no private key at ${privKeyPath}`)
  console.error(`       run: node scripts/keygen.mjs ${kid}`)
  process.exit(1)
}
const pubJWK = JSON.parse(readFileSync(pubKeyPath, 'utf8'))
const privJWK = JSON.parse(readFileSync(privKeyPath, 'utf8'))
const fingerprint = pubJWK.fingerprint

// ─── Mutate non-signature fields FIRST, then hash, then sign ─────────
//
// Important ordering: the signed hash must equal the canonical hash of
// the saved file (excluding signatures[]). So we mutate version,
// lastUpdated, and changelog FIRST, hash the resulting content, then
// append the signature. If we bump version/changelog AFTER hashing,
// the saved file would not re-hash to the signed value and the lint
// would catch the discrepancy.

const signedAt = new Date().toISOString()
const signerName = signerNameOverride ?? pubJWK.displayName ?? kid
const signerId = signerIdOverride ?? kid

// Idempotency pre-check: if this signer already signed this entry
// at its current state (= same hash WITHOUT a new changelog bump),
// no-op. We compute the hash a second time after mutation to compare.
const preMutationHash = canonicalContentHash(drug)
const existing = (drug.signatures ?? []).find(s =>
  s.signerKeyId === fingerprint && s.contentHash === preMutationHash
)
if (existing) {
  console.log(`✓ already signed by ${kid} (fingerprint ${fingerprint}) for hash ${preMutationHash.slice(0, 16)}…`)
  console.log('  no changes made.')
  process.exit(0)
}

drug.lastUpdated = signedAt.slice(0, 10)
drug.version = (drug.version ?? 0) + 1
if (!Array.isArray(drug.changelog)) drug.changelog = []
drug.changelog.push({
  version: drug.version,
  date: signedAt.slice(0, 10),
  summary: `Signed by ${signerName} (${fingerprint})`,
})

// Now hash the entry in its post-mutation state (still excluding signatures[])
const contentHash = canonicalContentHash(drug)

// Sign the hash with the loaded private key.
const cleanPriv = { kty: privJWK.kty, crv: privJWK.crv, x: privJWK.x, d: privJWK.d }
const privObj = createPrivateKey({ key: cleanPriv, format: 'jwk' })
const sigBytes = nodeSign(null, Buffer.from(contentHash, 'hex'), privObj)
const signatureB64 = sigBytes.toString('base64')

const record = {
  signerId,
  signerName,
  signerKeyId: fingerprint,
  contentHash,
  signature: signatureB64,
  signedAt,
}

drug.signatures = [...(drug.signatures ?? []), record]

// ─── Persist drug ─────────────────────────────────────────────────────

writeFileSync(drugPath, JSON.stringify(drug, null, 2) + '\n', 'utf8')

// ─── Append transparency log ──────────────────────────────────────────

const logDir = path.join(ROOT, 'content', 'log')
const logPath = path.join(logDir, 'transparency-log.jsonl')
if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true })

const logEntry = {
  entryType: 'drug-signature',
  drugSlug: slug,
  drugVersion: drug.version,
  signerId,
  signerName,
  signerKeyId: fingerprint,
  contentHash,
  signature: signatureB64,
  signedAt,
  logSeq: countLogLines(logPath) + 1,
}
appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf8')

// ─── Report ───────────────────────────────────────────────────────────

console.log('')
console.log(`✓ Signed ${slug}`)
console.log(`  signer:      ${signerName}  (kid: ${kid})`)
console.log(`  fingerprint: ${fingerprint}`)
console.log(`  contentHash: ${contentHash}`)
console.log(`  signature:   ${signatureB64.slice(0, 32)}…  (base64, 88 chars)`)
console.log(`  version:     ${drug.version}`)
console.log(`  log seq:     ${logEntry.logSeq}`)
console.log('')
console.log('Verify it:')
console.log(`  node scripts/verify.mjs      (CLI lint, crypto-verifies all signatures)`)
console.log(`  http://localhost:3000/verify/${slug}   (browser-side verify, no server trust)`)
console.log('')

function countLogLines(p) {
  if (!existsSync(p)) return 0
  return readFileSync(p, 'utf8').split('\n').filter(line => line.trim().length > 0).length
}
