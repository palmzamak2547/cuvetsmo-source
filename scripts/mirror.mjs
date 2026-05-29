#!/usr/bin/env node
// scripts/mirror.mjs — probe-and-fingerprint upstream citation URLs.
//
// Phase 0 CIDs hash *metadata* (sourceId + url + capturedAt + …). This
// script adds a probe layer on top: it fetches each citation URL,
// hashes the response body (SHA-256), records headers (Last-Modified,
// ETag, Content-Length, Content-Type) and writes the result into the
// citation file as a `probes` array entry.
//
// Important design choices:
//
//   - We do NOT store the body bytes. Only the SHA-256 hash + headers.
//     This keeps us copyright-clean: we don't republish third-party
//     content. A future reader who fetches the upstream URL themselves
//     can compare their hash to ours and detect whether the upstream
//     changed since we probed.
//
//   - The `canonical` sub-object is left untouched — its CID is
//     stable. Probes are a sibling field.
//
//   - Search-page URLs (DailyMed ?query=…) return dynamic HTML; the
//     body hash will drift over time. That is information, not error.
//     The probe entry stores the body hash + the timestamp; downstream
//     consumers decide what to do with drift.
//
//   - Rate-limited to one request per 2 seconds (polite to upstreams).
//   - 20-second timeout per request.
//
// Usage:
//   node scripts/mirror.mjs                    # probe all citations
//   node scripts/mirror.mjs --slug meloxicam   # only citations cited by meloxicam
//   node scripts/mirror.mjs --skip-recent 7    # skip citations probed in last 7 days
//   node scripts/mirror.mjs --dry-run          # report what would happen, no writes

import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CITATIONS_DIR = path.join(ROOT, 'content', 'citations')
const DRUGS_DIR = path.join(ROOT, 'content', 'drugs')

// ─── Args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const slugIdx = args.indexOf('--slug')
const slug = slugIdx >= 0 ? args[slugIdx + 1] : null
const skipRecentIdx = args.indexOf('--skip-recent')
const skipRecentDays = skipRecentIdx >= 0 ? parseInt(args[skipRecentIdx + 1], 10) : 0

// ─── Load citation files ─────────────────────────────────────────────

function loadCitations() {
  if (!existsSync(CITATIONS_DIR)) return []
  const files = readdirSync(CITATIONS_DIR).filter(f => f.endsWith('.json'))
  return files.map(f => ({
    cid: f.replace(/\.json$/, ''),
    path: path.join(CITATIONS_DIR, f),
    data: JSON.parse(readFileSync(path.join(CITATIONS_DIR, f), 'utf8')),
  }))
}

// Optionally restrict to citations cited by a specific drug.
function citationsForSlug(allCitations, slug) {
  const drugPath = path.join(DRUGS_DIR, `${slug}.json`)
  if (!existsSync(drugPath)) {
    console.error(`error: no drug at ${drugPath}`)
    process.exit(1)
  }
  const drug = JSON.parse(readFileSync(drugPath, 'utf8'))
  const cids = new Set([
    ...drug.citations.filter(c => c.cid).map(c => c.cid),
    ...(drug.mirrorCIDs ?? []).map(m => m.cid),
  ])
  return allCitations.filter(c => cids.has(c.cid))
}

// ─── Probe one URL ───────────────────────────────────────────────────

async function probe(url) {
  const startedAt = new Date().toISOString()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'cuvetsmo-source/0.0.1 (probe; +https://source.cuvetsmo.com/about) compatible',
        Accept: 'text/html,application/json,application/pdf,*/*;q=0.8',
      },
    })

    // Read body to hash it. We don't store the body, only its hash.
    const buf = Buffer.from(await res.arrayBuffer())
    const bodyHash = createHash('sha256').update(buf).digest('hex')

    return {
      probedAt: startedAt,
      method: 'GET',
      httpStatus: res.status,
      finalUrl: res.url,
      contentType: res.headers.get('content-type') ?? null,
      contentLength: buf.length,
      lastModified: res.headers.get('last-modified') ?? null,
      etag: res.headers.get('etag') ?? null,
      bodyHashSha256: bodyHash,
      note: 'Body hash is a snapshot at probedAt. For dynamic pages (e.g. search results) the hash will differ on later fetches — that is information, not error. Original body bytes are NOT stored (copyright-safe).',
    }
  } catch (err) {
    return {
      probedAt: startedAt,
      method: 'GET',
      httpStatus: 0,
      error: err.message ?? String(err),
      note: 'Probe failed. Could be network error, timeout, DNS, or upstream rejection.',
    }
  } finally {
    clearTimeout(timeout)
  }
}

// ─── Main ────────────────────────────────────────────────────────────

const allCitations = loadCitations()
const target = slug ? citationsForSlug(allCitations, slug) : allCitations

if (target.length === 0) {
  console.log('No citations to probe.')
  process.exit(0)
}

const now = Date.now()
const skipBeforeMs = skipRecentDays > 0 ? now - skipRecentDays * 86_400_000 : 0

console.log('')
console.log(`source.cuvetsmo.com — citation probe`)
console.log(`  targeting:    ${target.length} citation${target.length === 1 ? '' : 's'}${slug ? ` (cited by ${slug})` : ''}`)
console.log(`  dry-run:      ${dryRun}`)
console.log(`  skip-recent:  ${skipRecentDays} day(s)`)
console.log('')

let probed = 0
let skipped = 0
let failed = 0

for (let i = 0; i < target.length; i++) {
  const { cid, path: filePath, data } = target[i]
  const url = data.canonical?.url
  if (!url) {
    console.log(`  ⚠  ${cid.slice(0, 12)}…  no canonical.url`)
    continue
  }

  // Skip recently probed if --skip-recent set
  const latestProbe = (data.probes ?? []).reduce((latest, p) => {
    const t = Date.parse(p.probedAt ?? '')
    return Number.isFinite(t) && t > latest ? t : latest
  }, 0)
  if (skipBeforeMs > 0 && latestProbe > skipBeforeMs) {
    skipped++
    console.log(`  ↪ skip ${cid.slice(0, 12)}…  last probed ${new Date(latestProbe).toISOString().slice(0, 10)}`)
    continue
  }

  console.log(`  → probe ${cid.slice(0, 12)}…  ${data.canonical.sourceId.padEnd(10)} ${url.slice(0, 60)}${url.length > 60 ? '…' : ''}`)
  const result = await probe(url)

  if (result.httpStatus >= 200 && result.httpStatus < 400) {
    probed++
    console.log(`     ${result.httpStatus}  ${result.contentLength ?? '?'} bytes  sha256:${result.bodyHashSha256?.slice(0, 16)}…`)
  } else {
    failed++
    console.log(`     ${result.httpStatus}  ${result.error ?? 'unknown error'}`)
  }

  if (!dryRun) {
    const updated = {
      ...data,
      probes: [...(data.probes ?? []), result],
    }
    writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n', 'utf8')
  }

  // Rate limit — 2s between requests so we don't hammer upstreams.
  if (i < target.length - 1) {
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}

console.log('')
console.log(`Done. ${probed} probed${dryRun ? ' (dry-run, not persisted)' : ''}, ${skipped} skipped, ${failed} failed.`)
console.log('')
