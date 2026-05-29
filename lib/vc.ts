// W3C Verifiable Credentials primitives · Primitive 4 issuance + verify.
//
// Phase 0 issues plain signed JSON-LD credentials (no ZK selective
// disclosure). The schema is W3C VC Data Model 2.0 compatible. Future
// upgrades:
//   - BBS+ signatures for selective disclosure
//   - Polygon ID integration for on-chain attestation
//   - JWT envelope (vc-jwt) for legacy interop
//
// What we issue today:
//
//   VeterinaryLicenseCredential
//     subject: did:web:source.cuvetsmo.com:faculty:<id>
//     claim:   "holds a valid TH veterinary license at issuance time"
//     issuer:  did:web:source.cuvetsmo.com:board
//
//   EditorialReviewerCredential
//     subject: did:web:source.cuvetsmo.com:faculty:<id>
//     claim:   "authorized to sign editorial reviews on source.cuvetsmo.com"
//     issuer:  did:web:source.cuvetsmo.com:board

import type { Ed25519PrivateJWK, Ed25519PublicJWK } from './sign'
import { signHashWithJWK, verifyHashWithJWK } from './sign'
import { canonicalize } from './cid'
import { createHash } from 'crypto'

// ─── VC types ────────────────────────────────────────────────────────

export type VerifiableCredential = {
  '@context': string[]
  id: string  // a UUID-ish identifier
  type: string[]  // ['VerifiableCredential', '<specific type>']
  issuer: string  // DID
  issuanceDate: string  // ISO 8601
  expirationDate?: string
  credentialSubject: CredentialSubject
  proof?: CredentialProof
}

export type CredentialSubject = {
  id: string  // subject DID
  [claim: string]: unknown
}

export type CredentialProof = {
  type: 'Ed25519Signature2020'
  created: string
  proofPurpose: 'assertionMethod'
  verificationMethod: string  // did:web:...#key-1
  proofValue: string  // base64 Ed25519 signature
}

// ─── Issuance ────────────────────────────────────────────────────────

export type IssueArgs = {
  issuerDID: string
  issuerPrivJWK: Ed25519PrivateJWK
  issuerVerificationMethodId: string  // did:web:...#key-1
  subjectDID: string
  credentialType: string  // e.g. 'VeterinaryLicenseCredential'
  claims: Record<string, unknown>
  expirationDate?: string
}

export function issueCredential(args: IssueArgs): VerifiableCredential {
  const credential: VerifiableCredential = {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://source.cuvetsmo.com/contexts/v1.jsonld',
    ],
    id: `urn:uuid:${randomUUID()}`,
    type: ['VerifiableCredential', args.credentialType],
    issuer: args.issuerDID,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: args.subjectDID,
      ...args.claims,
    },
  }
  if (args.expirationDate) credential.expirationDate = args.expirationDate

  // Hash the credential without the proof, then sign.
  const toSign = canonicalCredentialHash(credential)
  const signature = signHashWithJWK(args.issuerPrivJWK, toSign)

  credential.proof = {
    type: 'Ed25519Signature2020',
    created: new Date().toISOString(),
    proofPurpose: 'assertionMethod',
    verificationMethod: args.issuerVerificationMethodId,
    proofValue: signature,
  }
  return credential
}

// ─── Verification ────────────────────────────────────────────────────

export type VerifyResult =
  | { ok: true; subject: string; issuer: string; types: string[] }
  | { ok: false; reason: string }

export function verifyCredential(vc: VerifiableCredential, issuerPubJWK: Ed25519PublicJWK): VerifyResult {
  if (!vc.proof) return { ok: false, reason: 'no proof block' }
  if (vc.proof.type !== 'Ed25519Signature2020') {
    return { ok: false, reason: `unsupported proof type "${vc.proof.type}"` }
  }
  // Expiry check.
  if (vc.expirationDate) {
    const exp = Date.parse(vc.expirationDate)
    if (Number.isFinite(exp) && exp < Date.now()) {
      return { ok: false, reason: `credential expired at ${vc.expirationDate}` }
    }
  }
  // Recompute the canonical hash WITHOUT proof, then Ed25519 verify.
  const toCheck = canonicalCredentialHash(vc)
  const valid = verifyHashWithJWK(issuerPubJWK, toCheck, vc.proof.proofValue)
  if (!valid) return { ok: false, reason: 'Ed25519 signature does not verify' }
  return {
    ok: true,
    subject: vc.credentialSubject.id,
    issuer: vc.issuer,
    types: vc.type,
  }
}

// ─── Internals ───────────────────────────────────────────────────────

function canonicalCredentialHash(vc: VerifiableCredential): string {
  const { proof: _drop, ...rest } = vc
  return createHash('sha256').update(canonicalize(rest), 'utf8').digest('hex')
}

function randomUUID(): string {
  // Node 14.17+ + all modern browsers
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback shouldn't be needed in our target environments.
  const hex = '0123456789abcdef'
  let out = ''
  for (let i = 0; i < 32; i++) {
    out += hex[Math.floor(Math.random() * 16)]
    if (i === 7 || i === 11 || i === 15 || i === 19) out += '-'
  }
  return out
}
