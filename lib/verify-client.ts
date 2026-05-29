// Browser-side signature verification · Primitive 1.
//
// This module runs IN THE READER'S BROWSER. The whole point of Primitive 1
// is that the reader does not need to trust our server — they can verify
// the signature themselves with code that ships in our bundle.
//
// Web Crypto Ed25519 support landed in:
//   - Chrome / Edge ≥ 113
//   - Firefox       ≥ 122
//   - Safari        ≥ 17 (iOS 17)
//
// For older browsers, isSupportedHere() returns false and the verify UI
// shows a "your browser cannot verify locally — read raw signature data
// below" fallback. We do NOT silently substitute server verification —
// that would defeat the whole trust model.

import type { Ed25519PublicJWK } from './sign'

// ─── Encoding helpers ────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  if (clean.length % 2 !== 0) throw new Error('hex string must have even length')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16)
  }
  return out
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

// ─── Capability detection ────────────────────────────────────────────

export function isSupportedHere(): boolean {
  return typeof crypto !== 'undefined'
    && typeof crypto.subtle !== 'undefined'
    && typeof crypto.subtle.importKey === 'function'
}

// ─── The verify function the page calls ──────────────────────────────

export type VerifyOutcome =
  | { ok: true; computedHashMatches: true }
  | { ok: false; reason: string; computedHashMatches?: boolean }

/**
 * Verify a signature in the browser.
 *
 * Inputs:
 *   - publicKey:   The signer's public key (JWK), fetched from
 *                  /api/keys/<kid> or read from a static asset.
 *   - contentHash: The hex SHA-256 over canonical content (the value
 *                  stored in signature.contentHash).
 *   - signatureB64: Base64-encoded Ed25519 signature.
 *   - independentlyComputedHash: (optional) If the caller computed the
 *                  hash from raw content themselves, pass it here. We
 *                  cross-check that it matches the claimed contentHash —
 *                  guarding against a tampered signature record that
 *                  claims a different hash than the content actually has.
 */
export async function verifySignature(args: {
  publicKey: Ed25519PublicJWK
  contentHash: string
  signatureB64: string
  independentlyComputedHash?: string
}): Promise<VerifyOutcome> {
  if (!isSupportedHere()) {
    return { ok: false, reason: 'browser-not-supported' }
  }

  // Cross-check the hash if the caller independently computed it.
  if (args.independentlyComputedHash !== undefined
      && args.independentlyComputedHash !== args.contentHash) {
    return {
      ok: false,
      reason: 'content-hash-mismatch',
      computedHashMatches: false,
    }
  }

  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      args.publicKey as JsonWebKey,
      { name: 'Ed25519' },
      true,
      ['verify'],
    )
    const sig = base64ToBytes(args.signatureB64)
    const data = hexToBytes(args.contentHash)
    // Cast to BufferSource — Uint8Array<ArrayBufferLike> is structurally
    // compatible but TS strict mode disagrees with the lib.dom typing.
    const valid = await crypto.subtle.verify('Ed25519', key, sig as BufferSource, data as BufferSource)
    if (!valid) {
      return {
        ok: false,
        reason: 'signature-invalid',
        computedHashMatches: args.independentlyComputedHash === args.contentHash,
      }
    }
    return { ok: true, computedHashMatches: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, reason: `verify-threw: ${msg}` }
  }
}

// ─── In-browser canonical hashing (matches lib/sign.ts canonicalContentHash) ─
//
// Used when the verify page wants to independently recompute the content
// hash from the drug JSON (rather than trusting signature.contentHash).
// This is the "don't even trust the signature record" verification mode.

function canonicalize(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']'
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj).sort()
    return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}'
  }
  return 'null'
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  const bytes = new Uint8Array(buf)
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0')
  return out
}

/**
 * In-browser counterpart of lib/sign.ts `canonicalContentHash`. Strip the
 * `signatures` field, canonicalize, SHA-256, hex.
 */
export async function browserCanonicalContentHash(drug: unknown): Promise<string> {
  if (drug === null || typeof drug !== 'object' || Array.isArray(drug)) {
    return sha256Hex(canonicalize(drug))
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { signatures: _drop, ...rest } = drug as Record<string, unknown>
  return sha256Hex(canonicalize(rest))
}
