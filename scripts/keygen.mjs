#!/usr/bin/env node
// scripts/keygen.mjs — generate an Ed25519 signing keypair.
//
// Usage:
//   node scripts/keygen.mjs <kid> [--display "Display Name"]
//
// Example:
//   node scripts/keygen.mjs cuvetsmo-board --display "CUVETSMO Editorial Board"
//
// Effects:
//   1. Generates a fresh Ed25519 keypair.
//   2. Writes the PUBLIC key to:  content/keys/<kid>.pub.json     (commit)
//   3. Writes the PRIVATE key to: ~/.cuvetsmo-keys/<kid>.priv.json (NEVER commit)
//   4. Updates content/keys/index.json with the new signer entry.
//
// Iron Rule 0 honesty:
//   - Private keys NEVER touch this repo. The home-dir path is enforced.
//   - For production faculty signing, replace this with hardware-key flow
//     (YubiKey or similar). Phase 0 uses software keys with explicit "this
//     is a custodied key, not faculty-managed" framing in the UI.

import { createHash, generateKeyPairSync } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const KEYS_DIR = path.join(ROOT, 'content', 'keys')
const PRIV_DIR = path.join(os.homedir(), '.cuvetsmo-keys')
const INDEX_PATH = path.join(KEYS_DIR, 'index.json')

// ─── Args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
if (args.length === 0 || args[0].startsWith('-')) {
  console.error('Usage: node scripts/keygen.mjs <kid> [--display "Display Name"]')
  console.error('Example: node scripts/keygen.mjs cuvetsmo-board --display "CUVETSMO Editorial Board"')
  process.exit(1)
}
const kid = args[0]
const displayIdx = args.indexOf('--display')
const displayName = displayIdx >= 0 && args[displayIdx + 1] ? args[displayIdx + 1] : kid

if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(kid)) {
  console.error(`error: kid "${kid}" must be lowercase alphanumeric with hyphens (kebab-case)`)
  process.exit(1)
}

// ─── Canonicalize + fingerprint (mirrors lib/sign.ts) ────────────────

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

function keyFingerprint(jwk) {
  const canonical = canonicalize({ kty: jwk.kty, crv: jwk.crv, x: jwk.x })
  const h = createHash('sha256').update(canonical, 'utf8').digest('hex')
  return `ed25519:${h.slice(0, 16)}`
}

// ─── Generate ─────────────────────────────────────────────────────────

const { publicKey, privateKey } = generateKeyPairSync('ed25519')
const pub = publicKey.export({ format: 'jwk' })
const priv = privateKey.export({ format: 'jwk' })
pub.kid = kid
priv.kid = kid
const fingerprint = keyFingerprint(pub)

// ─── Persist ──────────────────────────────────────────────────────────

if (!existsSync(KEYS_DIR)) mkdirSync(KEYS_DIR, { recursive: true })
if (!existsSync(PRIV_DIR)) mkdirSync(PRIV_DIR, { recursive: true })

const pubPath = path.join(KEYS_DIR, `${kid}.pub.json`)
const privPath = path.join(PRIV_DIR, `${kid}.priv.json`)

if (existsSync(pubPath)) {
  console.error(`error: public key already exists at ${pubPath} — refusing to overwrite`)
  console.error('       (delete the file manually if you really want to rotate)')
  process.exit(1)
}
if (existsSync(privPath)) {
  console.error(`error: private key already exists at ${privPath} — refusing to overwrite`)
  process.exit(1)
}

writeFileSync(pubPath, JSON.stringify({
  ...pub,
  fingerprint,
  displayName,
  generatedAt: new Date().toISOString(),
}, null, 2) + '\n', 'utf8')

writeFileSync(privPath, JSON.stringify({
  ...priv,
  fingerprint,
  displayName,
  generatedAt: new Date().toISOString(),
  warning: 'PRIVATE KEY — never commit, never share, never email. Lives outside the repo on purpose.',
}, null, 2) + '\n', 'utf8')

// ─── Update key index ─────────────────────────────────────────────────

let index = { keys: [] }
if (existsSync(INDEX_PATH)) {
  try {
    index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'))
    if (!Array.isArray(index.keys)) index.keys = []
  } catch {
    index = { keys: [] }
  }
}
index.keys.push({
  kid,
  fingerprint,
  displayName,
  pubKeyPath: `content/keys/${kid}.pub.json`,
  generatedAt: new Date().toISOString(),
})
writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + '\n', 'utf8')

// ─── Report ───────────────────────────────────────────────────────────

console.log('')
console.log('✓ Ed25519 keypair generated')
console.log(`  kid:         ${kid}`)
console.log(`  display:     ${displayName}`)
console.log(`  fingerprint: ${fingerprint}`)
console.log(`  public:      ${path.relative(ROOT, pubPath)}  (COMMIT this)`)
console.log(`  private:     ${privPath}  (NEVER commit — outside repo)`)
console.log('')
console.log('Next step:')
console.log(`  node scripts/sign.mjs <drug-slug> --signer ${kid}`)
console.log('')
