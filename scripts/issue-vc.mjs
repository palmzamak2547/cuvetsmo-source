#!/usr/bin/env node
// scripts/issue-vc.mjs — issue a Verifiable Credential.
//
// Usage:
//   node scripts/issue-vc.mjs \
//     --issuer-kid cuvetsmo-board \
//     --issuer-did did:web:source.cuvetsmo.com \
//     --subject-did did:web:source.cuvetsmo.com \
//     --type EditorialAuthorityCredential \
//     --claims '{"authority":"root","scope":"source.cuvetsmo.com"}' \
//     --out content/credentials/board-root.vc.json
//
// Effects:
//   1. Loads ~/.cuvetsmo-keys/<issuer-kid>.priv.json
//   2. Constructs a W3C VC with the given subject/type/claims
//   3. Signs the canonical hash with Ed25519
//   4. Writes the credential JSON to --out

import { createHash, createPrivateKey, sign as nodeSign, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
function getFlag(name, required = false) {
  const i = args.indexOf(name)
  if (i < 0 || !args[i + 1]) {
    if (required) {
      console.error(`error: ${name} required`)
      process.exit(1)
    }
    return null
  }
  return args[i + 1]
}

const issuerKid = getFlag('--issuer-kid', true)
const issuerDID = getFlag('--issuer-did', true)
const subjectDID = getFlag('--subject-did', true)
const credType = getFlag('--type', true)
const claimsRaw = getFlag('--claims', true)
const outPath = getFlag('--out', true)
const expiration = getFlag('--expires')

let claims
try {
  claims = JSON.parse(claimsRaw)
} catch (e) {
  console.error(`error: --claims must be valid JSON. Got: ${claimsRaw}`)
  process.exit(1)
}

// ─── Canonicalize (mirrors lib/cid.ts) ───────────────────────────────

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

// ─── Load issuer key ──────────────────────────────────────────────────

const privKeyPath = path.join(os.homedir(), '.cuvetsmo-keys', `${issuerKid}.priv.json`)
const pubKeyPath = path.join(ROOT, 'content', 'keys', `${issuerKid}.pub.json`)
if (!existsSync(privKeyPath)) {
  console.error(`error: no private key at ${privKeyPath}`)
  console.error(`       run: node scripts/keygen.mjs ${issuerKid}`)
  process.exit(1)
}
const privJWK = JSON.parse(readFileSync(privKeyPath, 'utf8'))
const pubJWK = JSON.parse(readFileSync(pubKeyPath, 'utf8'))
const fingerprint = pubJWK.fingerprint

// ─── Build the credential ─────────────────────────────────────────────

const issuanceDate = new Date().toISOString()
const credential = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://source.cuvetsmo.com/contexts/v1.jsonld',
  ],
  id: `urn:uuid:${randomUUID()}`,
  type: ['VerifiableCredential', credType],
  issuer: issuerDID,
  issuanceDate,
  credentialSubject: {
    id: subjectDID,
    ...claims,
  },
}
if (expiration) credential.expirationDate = expiration

// ─── Sign ─────────────────────────────────────────────────────────────

const toSignHash = createHash('sha256').update(canonicalize(credential), 'utf8').digest('hex')
const cleanPriv = { kty: privJWK.kty, crv: privJWK.crv, x: privJWK.x, d: privJWK.d }
const privObj = createPrivateKey({ key: cleanPriv, format: 'jwk' })
const sigBytes = nodeSign(null, Buffer.from(toSignHash, 'hex'), privObj)
const proofValue = sigBytes.toString('base64')

credential.proof = {
  type: 'Ed25519Signature2020',
  created: new Date().toISOString(),
  proofPurpose: 'assertionMethod',
  verificationMethod: `${issuerDID}#${issuerKid}`,
  proofValue,
}

// ─── Persist ──────────────────────────────────────────────────────────

const absOut = path.isAbsolute(outPath) ? outPath : path.join(ROOT, outPath)
const outDir = path.dirname(absOut)
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
writeFileSync(absOut, JSON.stringify(credential, null, 2) + '\n', 'utf8')

// ─── Report ───────────────────────────────────────────────────────────

console.log('')
console.log(`✓ Verifiable Credential issued`)
console.log(`  id:        ${credential.id}`)
console.log(`  type:      ${credType}`)
console.log(`  issuer:    ${issuerDID}`)
console.log(`  subject:   ${subjectDID}`)
console.log(`  signedBy:  ${fingerprint}`)
console.log(`  signedAt:  ${credential.proof.created}`)
console.log(`  written:   ${path.relative(ROOT, absOut)}`)
console.log('')
