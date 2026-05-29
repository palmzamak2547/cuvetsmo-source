// Content-addressed citations · Primitive 2.
//
// Every external citation we mirror gets a content identifier (CID) =
// SHA-256 over a canonical JSON representation of its metadata (or the
// raw bytes once we mirror them in full). The CID becomes the lookup
// key on disk (`content/citations/<cid>.json`) and the public route
// (`/c/<cid>`).
//
// "Canonical JSON" = keys sorted alphabetically, no whitespace, UTF-8
// encoded. Same protocol drives Primitive 1 (signatures sign a content
// hash computed the same way).
//
// Week 1 status:
//   - Metadata-only CIDs (`status: "stub"`). Real bytes-mirroring
//     comes via scripts/mirror.ts in Week 2+.
//   - Sync (Node crypto) only. Browser-side verification (Web Crypto)
//     ships in Week 2 alongside signature verification.

import { createHash } from 'crypto'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

/** Returns the SHA-256 hex digest of `obj` in canonical JSON form. */
export function computeCID(obj: unknown): string {
  return createHash('sha256').update(canonicalize(obj), 'utf8').digest('hex')
}

/** Verify `obj` hashes to `claimed`. */
export function verifyCID(obj: unknown, claimed: string): boolean {
  return computeCID(obj) === claimed
}

/** Display form for UI: `65f15af1…0d5a`. */
export function shortCID(cid: string): string {
  if (cid.length < 14) return cid
  return `${cid.slice(0, 8)}…${cid.slice(-4)}`
}

/** True if a string looks like a SHA-256 hex digest. */
export function isCID(s: string): boolean {
  return /^[0-9a-f]{64}$/i.test(s)
}

/**
 * Server-side reader: load the citation metadata stub at
 * content/citations/<cid>.json. Returns null if not found.
 *
 * The file shape is:
 *   {
 *     cid:        "<hex>",        // matches the filename
 *     note:       "...",          // human-readable provenance note
 *     canonical:  { ... }         // the exact subobject whose CID = cid
 *   }
 *
 * `verifyCID(file.canonical, file.cid)` MUST return true. The
 * verify-content CI script enforces this on every PR.
 */
export async function loadCitation(cid: string): Promise<CitationFile | null> {
  if (!isCID(cid)) return null
  const filePath = path.join(process.cwd(), 'content', 'citations', `${cid}.json`)
  if (!existsSync(filePath)) return null
  try {
    const raw = await readFile(filePath, 'utf8')
    return JSON.parse(raw) as CitationFile
  } catch {
    return null
  }
}

export type CitationFile = {
  cid: string
  note: string
  canonical: {
    sourceId: string
    name: string
    url: string
    license: string
    capturedAt: string
    status: 'stub' | 'mirrored' | 'rotted'
  }
  /** Probe history — added by scripts/mirror.mjs. Each entry is the
   *  result of one upstream fetch: status code, headers, body hash
   *  (we never store the body itself, only the SHA-256 hash). */
  probes?: ProbeRecord[]
}

export type ProbeRecord = {
  probedAt: string
  method?: string
  httpStatus: number
  finalUrl?: string
  contentType?: string | null
  contentLength?: number
  lastModified?: string | null
  etag?: string | null
  bodyHashSha256?: string
  error?: string
  note?: string
}

// ─── Canonicalization (recursive sorted-key JSON) ─────────────────────
//
// Exported so lib/sign.ts can reuse the same canonical form when hashing
// drug content for signatures (Primitive 1). Single source of truth —
// signing and content-addressing MUST produce the same byte sequence.

export function canonicalize(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']'
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj).sort()
    const parts = keys.map(k => JSON.stringify(k) + ':' + canonicalize(obj[k]))
    return '{' + parts.join(',') + '}'
  }
  // undefined, function, symbol — drop
  return 'null'
}
