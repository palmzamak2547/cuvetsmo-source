// Cryptographic signing primitives · Primitive 1.
//
// Ed25519 detached signatures over the canonical content hash of a drug
// entry. We use Ed25519 (RFC 8032) because:
//   - small keys (32 bytes pub, 64 bytes signature)
//   - fast verification (sub-millisecond in browsers)
//   - native Web Crypto support in Chrome 113+, FF 122+, Safari 17+,
//     and node:crypto support since Node 16+
//   - no curve nonce vagaries (deterministic signatures)
//
// Architectural contract:
//
//   contentHash = SHA-256(canonicalJSON(drug WITHOUT signatures[]))
//
// Signing excludes the signatures[] field itself (otherwise circular).
// All other fields — including drafting, mirrorCIDs, codes, citations —
// are part of the signed payload. Any post-signing edit anywhere in the
// entry breaks the signature.
//
// Week 2 (this module): Node-side signing (build-time / CLI).
//   - canonicalContentHash(drug)  → hex SHA-256
//   - signWithJWK(privJWK, hash)  → Ed25519 signature as base64
//
// Week 2 (lib/verify-client.ts): Browser-side verify (no server trust).
//
// Week 5 stretch:
//   - Sigstore/Rekor transparency log integration
//   - Hardware-key-backed signing (YubiKey or similar)

import { createHash, createPrivateKey, createPublicKey, sign as nodeSign, verify as nodeVerify, generateKeyPairSync } from 'crypto'
import type { JsonWebKey as NodeJsonWebKey } from 'crypto'
import type { Drug, Signature } from './drugs'
import { canonicalize } from './cid'

// ─── Content hashing (drug → hash for signing) ────────────────────────

/**
 * Compute the SHA-256 hex digest of a drug's canonical content, EXCLUDING
 * the signatures[] field. Two entries with identical clinical content
 * produce identical hashes regardless of who has signed.
 *
 * This is the bytes that get signed.
 */
export function canonicalContentHash(drug: Drug): string {
  const { signatures: _drop, ...rest } = drug
  return createHash('sha256').update(canonicalize(rest), 'utf8').digest('hex')
}

// ─── JWK types (subset we use) ────────────────────────────────────────

export type Ed25519PublicJWK = {
  kty: 'OKP'
  crv: 'Ed25519'
  /** Public key, base64url, 43 chars (32 bytes). */
  x: string
  /** Optional: a stable id Palm chose, e.g. "cuvetsmo-board". */
  kid?: string
}

export type Ed25519PrivateJWK = Ed25519PublicJWK & {
  /** Private key, base64url, 43 chars (32 bytes). NEVER commit to repo. */
  d: string
}

// ─── Keygen ───────────────────────────────────────────────────────────

/**
 * Generate a fresh Ed25519 keypair as JWK pair. Caller is responsible for
 * persisting the private key SAFELY (NOT in the repo). The public key
 * lands in content/keys/<kid>.pub.json and is committed.
 */
export function generateEd25519JWK(kid: string): {
  pub: Ed25519PublicJWK
  priv: Ed25519PrivateJWK
} {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519')
  const pubJWK = publicKey.export({ format: 'jwk' }) as Ed25519PublicJWK
  const privJWK = privateKey.export({ format: 'jwk' }) as Ed25519PrivateJWK
  pubJWK.kid = kid
  privJWK.kid = kid
  return { pub: pubJWK, priv: privJWK }
}

// ─── Fingerprint (key ID for signatures[].signerKeyId) ────────────────

/**
 * Deterministic fingerprint of a public key. Used as `signerKeyId` in
 * signatures, so the verifier can find the right key without trusting
 * `signerId` to be honest.
 *
 * Format: "ed25519:<sha256-hex-first-16-chars>" over the canonical JWK.
 */
export function keyFingerprint(jwk: Ed25519PublicJWK): string {
  const canonical = canonicalize({ kty: jwk.kty, crv: jwk.crv, x: jwk.x })
  const h = createHash('sha256').update(canonical, 'utf8').digest('hex')
  return `ed25519:${h.slice(0, 16)}`
}

// ─── Sign + verify (Node side, for scripts/sign.mjs + scripts/verify) ─

/**
 * Sign a content hash with an Ed25519 private key JWK.
 * Returns the detached signature as base64 (not base64url — JSON-safe).
 */
export function signHashWithJWK(privJWK: Ed25519PrivateJWK, contentHash: string): string {
  const keyObj = createPrivateKey({ key: privJWK as unknown as NodeJsonWebKey, format: 'jwk' })
  const sig = nodeSign(null, Buffer.from(contentHash, 'hex'), keyObj)
  return sig.toString('base64')
}

/**
 * Verify a base64 signature against a content hash + public key JWK.
 * Returns true iff the signature is valid.
 */
export function verifyHashWithJWK(pubJWK: Ed25519PublicJWK, contentHash: string, signatureB64: string): boolean {
  try {
    const keyObj = createPublicKey({ key: pubJWK as unknown as NodeJsonWebKey, format: 'jwk' })
    return nodeVerify(null, Buffer.from(contentHash, 'hex'), keyObj, Buffer.from(signatureB64, 'base64'))
  } catch {
    return false
  }
}

// ─── Build a Signature record (the shape that lives in drug.signatures[]) ─

export function buildSignatureRecord(args: {
  drug: Drug
  privJWK: Ed25519PrivateJWK
  signerId: string
  signerName: string
  signerKeyId: string
  signedAt?: string
}): Signature {
  const contentHash = canonicalContentHash(args.drug)
  const signature = signHashWithJWK(args.privJWK, contentHash)
  return {
    signerId: args.signerId,
    signerName: args.signerName,
    signerKeyId: args.signerKeyId,
    contentHash,
    signature,
    signedAt: args.signedAt ?? new Date().toISOString(),
  }
}
