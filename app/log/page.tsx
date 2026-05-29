// /log — full transparency log viewer.
//
// Renders every signing event in reverse chronological order.
// Append-only by design; the git history of content/log/transparency-log.jsonl
// makes the file itself tamper-evident.

import Link from 'next/link'
import { readLog } from '@/lib/log'
import { findDrug } from '@/lib/drugs'
import { shortCID } from '@/lib/cid'

export const metadata = {
  title: 'Transparency log',
  description: 'Append-only audit trail of every cryptographic signing event on source.cuvetsmo.com — git-tracked, tamper-evident.',
}

export default function LogPage() {
  const entries = readLog().slice().sort((a, b) => b.logSeq - a.logSeq)
  const signerCount = new Set(entries.map(e => e.signerKeyId)).size
  const drugCount = new Set(entries.map(e => e.drugSlug)).size

  return (
    <article>
      <header className="border-b border-paper-300 pb-7">
        <p className="eyebrow">Transparency log</p>
        <h1 className="display-h1 mt-3">The audit trail.</h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          ทุกครั้งที่มีคนเซ็น entry หรือ issue credential ระบบ append ใหม่ลง <code className="rounded bg-paper-100 px-1.5 py-0.5 text-[14px]">content/log/transparency-log.jsonl</code> —
          ไฟล์เดียว, append-only, git-tracked. ใครก็ดูได้, ใครก็ตรวจสอบประวัติ commit ได้.
        </p>
      </header>

      {/* Summary */}
      <section className="mt-8 grid gap-px overflow-hidden rounded-md border border-paper-300 bg-paper-300 sm:grid-cols-3">
        <Tile label="Log entries" value={entries.length} sub="signing events recorded" />
        <Tile label="Signers" value={signerCount} sub="distinct Ed25519 keys" />
        <Tile label="Entries touched" value={drugCount} sub="drugs with at least 1 signature" />
      </section>

      {/* Entries */}
      {entries.length === 0 ? (
        <p className="mt-12 rounded-md border border-paper-300 bg-paper-50 p-10 text-center text-ink-700">
          ยังไม่มี signing event — Phase 0 yet to onboard faculty signers
        </p>
      ) : (
        <section className="mt-12">
          <p className="eyebrow">All signing events, newest first</p>
          <ol className="mt-5 space-y-3">
            {entries.map(e => {
              const drug = findDrug(e.drugSlug)
              return (
                <li key={e.logSeq} className="rounded-md border border-paper-300 bg-paper-50 p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-3">
                      <span className="rounded-full border border-source-400 bg-paper-50 px-2 py-0.5 text-[11px] font-semibold tabular text-source-800">
                        #{e.logSeq.toString().padStart(3, '0')}
                      </span>
                      <span className="text-[11px] uppercase tracking-wider text-ink-500">
                        {e.entryType.replace('-', ' ')}
                      </span>
                    </div>
                    <time className="text-[11px] tabular text-ink-500">
                      {e.signedAt.replace('T', ' · ').slice(0, 19)} UTC
                    </time>
                  </div>

                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                    <Link href={`/drugs/${e.drugSlug}`} className="hover:text-source-800 hover:underline">
                      {drug?.nameEn ?? e.drugSlug}
                    </Link>
                    {drug?.nameTh && (
                      <span className="ml-2 text-base font-normal italic text-ink-700">{drug.nameTh}</span>
                    )}
                    <span className="ml-2 align-middle text-xs font-normal text-ink-500">v{e.drugVersion}</span>
                  </h3>

                  <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-[140px_1fr]">
                    <dt className="font-semibold text-paper-900">Signer</dt>
                    <dd className="text-ink-800">
                      {e.signerName} <span className="font-mono text-[10px] text-ink-500">({e.signerId})</span>
                    </dd>
                    <dt className="font-semibold text-paper-900">Key fingerprint</dt>
                    <dd className="font-mono text-[11px] text-source-800">{e.signerKeyId}</dd>
                    <dt className="font-semibold text-paper-900">Content hash</dt>
                    <dd className="break-all font-mono text-[10px] text-ink-700">{e.contentHash}</dd>
                    <dt className="font-semibold text-paper-900">Signature</dt>
                    <dd className="break-all font-mono text-[10px] text-ink-500">{e.signature}</dd>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-3 text-[11px]">
                    <Link
                      href={`/verify/${e.drugSlug}`}
                      className="rounded border border-paper-300 bg-paper-50 px-2.5 py-1 text-source-800 hover:border-source-500"
                    >
                      Verify in browser →
                    </Link>
                    {drug?.mirrorCIDs?.[0] && (
                      <Link
                        href={`/c/${drug.mirrorCIDs[0].cid}`}
                        className="rounded border border-paper-300 bg-paper-50 px-2.5 py-1 font-mono text-source-800 hover:border-source-500"
                      >
                        c/{shortCID(drug.mirrorCIDs[0].cid)}
                      </Link>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {/* What this proves */}
      <aside className="mt-16 rounded-md border-l-4 border-source-300 bg-source-50/40 px-6 py-5 text-sm">
        <p className="eyebrow">Why a transparency log?</p>
        <p className="mt-2 leading-relaxed text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          The file <code>content/log/transparency-log.jsonl</code> is append-only by code (scripts/sign.mjs never edits or deletes lines).
          The file is git-committed, so its history is itself tamper-evident — anyone can <code>git log -p content/log/</code> และเห็นทุก
          การเปลี่ยนแปลง. การลบหรือแก้ไขย้อนหลังจะปรากฏใน git diff.
        </p>
      </aside>
    </article>
  )
}

function Tile({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="bg-paper-50 p-6 text-source-900">
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{value}</p>
      <p className="mt-1 text-[11px] opacity-70 leading-snug">{sub}</p>
    </div>
  )
}
