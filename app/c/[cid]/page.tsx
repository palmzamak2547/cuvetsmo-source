// Content-addressed citation viewer · /c/<cid>
//
// Every external citation we mirror has a stable URL of the form
// /c/<SHA-256-hex>. The hash is computed over a canonical JSON
// representation of the citation metadata (see lib/cid.ts) — so the
// URL itself proves what is being cited.
//
// Week 1 status: stub citations (metadata-only, no bytes mirrored).
// The page shows the canonical metadata, verifies the hash, and links
// out to the upstream URL until the full mirror lands in Week 2+.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isCID, loadCitation, computeCID, shortCID } from '@/lib/cid'
import { DRUGS } from '@/lib/drugs'

export async function generateStaticParams() {
  // Pre-render every CID that any drug references.
  const cids = new Set<string>()
  for (const d of DRUGS) {
    for (const c of d.citations) {
      if (c.cid) cids.add(c.cid)
    }
    for (const m of d.mirrorCIDs ?? []) {
      cids.add(m.cid)
    }
  }
  return Array.from(cids).map(cid => ({ cid }))
}

export async function generateMetadata({ params }: { params: Promise<{ cid: string }> }) {
  const { cid } = await params
  const file = await loadCitation(cid)
  if (!file) return { title: 'Citation not found' }
  return {
    title: `Citation ${shortCID(cid)} — ${file.canonical.name}`,
    description: `Content-addressed citation snapshot. Source: ${file.canonical.name}. Captured: ${file.canonical.capturedAt}.`,
  }
}

export default async function CitationPage({ params }: { params: Promise<{ cid: string }> }) {
  const { cid } = await params
  if (!isCID(cid)) notFound()
  const file = await loadCitation(cid)
  if (!file) notFound()

  const verified = computeCID(file.canonical) === cid
  const c = file.canonical

  // Find which drug entries reference this CID.
  const usedBy = DRUGS.filter(d =>
    d.citations.some(cit => cit.cid === cid) ||
    (d.mirrorCIDs ?? []).some(m => m.cid === cid)
  )

  return (
    <article className="max-w-3xl">
      <nav className="text-xs text-ink-700">
        <Link href="/drugs" className="hover:text-source-800">← back to Drug Reference</Link>
      </nav>

      <header className="mt-6 border-b border-paper-300 pb-7">
        <p className="eyebrow">Content-addressed citation</p>
        <h1 className="mt-3 break-all font-mono text-2xl font-semibold text-ink-900 sm:text-3xl" style={{ fontFamily: 'var(--font-mono)' }}>
          {shortCID(cid)}
        </h1>
        <p className="mt-3 break-all font-mono text-[11px] text-ink-500">{cid}</p>
      </header>

      {/* Verification banner */}
      {verified ? (
        <div className="mt-6 rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-bold">✓ Hash verifies</p>
          <p className="mt-1 text-xs text-emerald-800">
            SHA-256 ของ canonical metadata ตรงกับ CID ใน URL — เนื้อหาด้านล่างไม่ถูกแก้หลังจาก captured
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border-2 border-red-400 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-bold">⚠ Hash does NOT verify</p>
          <p className="mt-1 text-xs text-red-800">
            CID ใน URL ไม่ match กับ hash ของ canonical metadata — possibly tampered. Report to maintainers.
          </p>
        </div>
      )}

      {/* Canonical metadata */}
      <section className="mt-6 rounded-xl border border-paper-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-paper-900">Canonical metadata</h2>
        <p className="mt-1 text-[11px] text-paper-700">
          The exact JSON sub-object whose SHA-256 hash equals the CID above
        </p>
        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-[140px_1fr]">
          <dt className="font-semibold text-paper-900">Source</dt>
          <dd className="text-paper-800">{c.name}</dd>

          <dt className="font-semibold text-paper-900">Source ID</dt>
          <dd className="font-mono text-paper-800">{c.sourceId}</dd>

          <dt className="font-semibold text-paper-900">URL</dt>
          <dd>
            <a href={c.url} target="_blank" rel="noreferrer" className="break-all text-source-700 hover:underline">
              {c.url}
            </a>
          </dd>

          <dt className="font-semibold text-paper-900">License</dt>
          <dd className="text-paper-800">{c.license}</dd>

          <dt className="font-semibold text-paper-900">Captured</dt>
          <dd className="text-paper-800">{c.capturedAt}</dd>

          <dt className="font-semibold text-paper-900">Status</dt>
          <dd>
            <StatusPill status={c.status} />
          </dd>
        </dl>
      </section>

      {/* Status explainer */}
      {c.status === 'stub' && (
        <section className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
          <p>
            <b>Status: stub.</b> Bytes are not yet mirrored to this CID address. The hash is computed
            over the metadata block above only. Read the original at the upstream URL.
            Full bytes-mirroring ships with <code>scripts/mirror.ts</code> in Week 2+ (see ARCHITECTURE.md).
          </p>
        </section>
      )}
      {c.status === 'mirrored' && (
        <section className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-900">
          <p>
            <b>Status: mirrored.</b> Full content bytes are stored at the platform under this hash —
            even if the upstream URL changes or 404s, the cited bytes remain accessible here forever.
          </p>
        </section>
      )}
      {c.status === 'rotted' && (
        <section className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-xs text-red-900">
          <p>
            <b>Status: rotted.</b> The upstream URL no longer serves the content this hash was computed
            over. Treat with caution — the snapshot we mirrored stays available, but the canonical source
            has drifted.
          </p>
        </section>
      )}

      {/* Provenance note */}
      <section className="mt-4 rounded-md border border-paper-200 bg-paper-100 p-4 text-xs text-ink-700">
        <p>{file.note}</p>
      </section>

      {/* Probe history */}
      {file.probes && file.probes.length > 0 && (
        <section className="mt-6 rounded-md border border-paper-300 bg-white p-5">
          <h2 className="text-sm font-semibold text-ink-900">Probe history · upstream fingerprint</h2>
          <p className="mt-1 text-[11px] text-ink-500">
            We periodically fetch the upstream URL and store: HTTP status, response headers,
            and <b>SHA-256 of the body</b>. The body itself is <b>never stored</b> (copyright-safe).
            Future readers can re-fetch the upstream and compare hashes to detect drift.
          </p>
          <ol className="mt-4 space-y-3 text-xs">
            {file.probes.slice().sort((a, b) => Date.parse(b.probedAt) - Date.parse(a.probedAt)).map((p, i) => {
              const ok = p.httpStatus >= 200 && p.httpStatus < 400
              return (
                <li key={i} className={`rounded-md border-l-4 ${ok ? 'border-emerald-400 bg-emerald-50/40' : 'border-red-400 bg-red-50/40'} px-4 py-3`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-ink-900 tabular">
                      {ok ? '✓' : '✗'} HTTP {p.httpStatus || '—'}
                      <span className="ml-2 font-normal text-ink-500">{p.method ?? 'GET'}</span>
                    </p>
                    <time className="text-[10px] tabular text-ink-500">{p.probedAt.replace('T', ' · ').slice(0, 19)} UTC</time>
                  </div>
                  {p.error ? (
                    <p className="mt-2 text-red-900">Error: {p.error}</p>
                  ) : (
                    <dl className="mt-2 grid gap-x-4 gap-y-1 text-[11px] sm:grid-cols-[120px_1fr]">
                      {p.contentType && (<><dt className="text-ink-500">Content-Type</dt><dd className="font-mono">{p.contentType}</dd></>)}
                      {p.contentLength !== undefined && (<><dt className="text-ink-500">Content-Length</dt><dd className="font-mono tabular">{p.contentLength.toLocaleString()} bytes</dd></>)}
                      {p.lastModified && (<><dt className="text-ink-500">Last-Modified</dt><dd className="font-mono">{p.lastModified}</dd></>)}
                      {p.etag && (<><dt className="text-ink-500">ETag</dt><dd className="font-mono">{p.etag}</dd></>)}
                      {p.bodyHashSha256 && (<><dt className="text-ink-500">Body SHA-256</dt><dd className="break-all font-mono text-source-800">{p.bodyHashSha256}</dd></>)}
                      {p.finalUrl && p.finalUrl !== file.canonical.url && (<><dt className="text-ink-500">Final URL</dt><dd className="break-all"><a href={p.finalUrl} target="_blank" rel="noreferrer" className="text-source-800 hover:underline">{p.finalUrl}</a></dd></>)}
                    </dl>
                  )}
                  {p.note && <p className="mt-2 text-[10px] italic text-ink-500">{p.note}</p>}
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {/* Cross-references */}
      {usedBy.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-paper-900">Cited by</h2>
          <ul className="mt-2 space-y-1.5">
            {usedBy.map(d => (
              <li key={d.slug}>
                <Link
                  href={`/drugs/${d.slug}`}
                  className="text-sm text-source-700 hover:underline"
                >
                  {d.nameEn} ({d.nameTh})
                </Link>
                <span className="ml-2 text-[11px] text-paper-700">— {d.class}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Anti-fabrication framing */}
      <footer className="mt-10 rounded-xl border border-source-300 bg-source-50 p-4 text-xs text-source-900">
        <p className="font-semibold">ทำไมต้อง content-addressed?</p>
        <p className="mt-1">
          URL เปลี่ยน, เว็บหาย, เนื้อหาถูกแก้หลัง publish ได้ — แต่ <b>hash ของเนื้อหา</b> ไม่เคยโกหก
          ทุก citation บน source.cuvetsmo.com มี CID ที่ readers verify ได้ในเครื่องตัวเอง
          ไม่ต้องเชื่อเรา ไม่ต้องเชื่อใคร เชื่อ math
        </p>
      </footer>
    </article>
  )
}

function StatusPill({ status }: { status: 'stub' | 'mirrored' | 'rotted' }) {
  const styles = {
    stub:     'border-amber-300   bg-amber-50   text-amber-800',
    mirrored: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    rotted:   'border-red-300     bg-red-50     text-red-800',
  } as const
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}>
      {status}
    </span>
  )
}
