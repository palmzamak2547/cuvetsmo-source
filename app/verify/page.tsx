// /verify — landing for the verification UX.
//
// Lists every drug entry that has at least one signature, plus a quick
// explanation of what verification proves (and what it does NOT prove).

import Link from 'next/link'
import { DRUGS, findDrug } from '@/lib/drugs'
import { readLogLatest } from '@/lib/log'

export const metadata = {
  title: 'Verify',
  description: 'Browser-side cryptographic verification — re-hash, re-verify, and audit every signature without trusting our server.',
}

export default function VerifyLanding() {
  const signed = DRUGS.filter(d => d.signatures.length > 0)
  const unsigned = DRUGS.filter(d => d.signatures.length === 0)
  const latestSignings = readLogLatest(5)

  return (
    <article>
      <header className="border-b border-paper-300 pb-7">
        <p className="eyebrow">Browser-side verification</p>
        <h1 className="display-h1 mt-3">Verify in your browser.</h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          ทุก entry บน source.cuvetsmo.com มี cryptographic signature ที่คุณ verify ได้ในเครื่องตัวเอง.
          ไม่ต้องเชื่อ server ของเรา ไม่ต้องเชื่อใคร — เชื่อ <span className="font-mono text-source-800">Ed25519 + SHA-256</span>.
        </p>
      </header>

      {/* What verification proves vs doesn't */}
      <section className="mt-10 grid gap-10 md:grid-cols-2">
        <div className="border-l-4 border-emerald-500 pl-5">
          <p className="eyebrow text-emerald-800">พิสูจน์ได้</p>
          <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            <li>เนื้อหา <b>ไม่ถูกแก้</b> หลังจาก signer เซ็น</li>
            <li>signer <b>คนนั้นจริง</b> เป็นผู้เซ็น — ไม่ใช่ impostor</li>
            <li>signature ตรงกับ public key ที่ commit ไว้ใน <code className="rounded bg-paper-100 px-1 py-0.5 text-[13px]">content/keys/</code></li>
            <li>การ verify ทำในเครื่องคุณ ไม่ต้องเชื่อ server</li>
          </ul>
        </div>
        <div className="border-l-4 border-amber-500 pl-5">
          <p className="eyebrow text-amber-800">ไม่พิสูจน์</p>
          <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            <li>เนื้อหา <b>ถูกต้องทางคลินิก</b> — นั่นคืองานของ faculty review (banner emerald)</li>
            <li>public key ของ signer <b>เป็นของคนจริง</b> ที่อ้าง — ต้องเชื่อ key registry</li>
            <li>citations ทั้งหมด <b>ถูกอ้างถูกต้อง</b> — verify เฉพาะ integrity ของ bytes</li>
          </ul>
        </div>
      </section>

      <hr className="rule-double" />

      {/* Signed entries */}
      {signed.length > 0 && (
        <section>
          <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-paper-200 pb-2.5">
            <h2 className="display-h2">Entries with signatures</h2>
            <p className="text-[11px] uppercase tracking-wider text-ink-500 tabular">
              {signed.length} entr{signed.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {signed.map(d => (
              <li key={d.slug}>
                <Link
                  href={`/verify/${d.slug}`}
                  className="flex h-full flex-col rounded-md border border-source-300 bg-paper-50 p-5 transition hover:-translate-y-0.5 hover:border-source-500 hover:bg-paper-100/60"
                >
                  <p className="eyebrow text-source-800">{d.class.split('—')[0].trim()}</p>
                  <h3 className="mt-2 text-[17px] font-semibold text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                    {d.nameEn}
                  </h3>
                  <p className="text-[13px] italic text-ink-700" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{d.nameTh}</p>
                  <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] tabular text-ink-500">
                    <span className="text-source-800">🔏 {d.signatures.length}</span>
                    <span aria-hidden>·</span>
                    <span>v{d.version}</span>
                    <span className="ml-auto">
                      {d.reviewedBy ? (
                        <span className="text-emerald-700">canonical</span>
                      ) : (
                        <span className="text-amber-700">infra</span>
                      )}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Unsigned */}
      {unsigned.length > 0 && (
        <section className="mt-14">
          <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-paper-200 pb-2.5">
            <h2 className="display-h2">◆ Sourced — ยังไม่มี expert signature</h2>
            <p className="text-[11px] uppercase tracking-wider text-ink-500 tabular">
              {unsigned.length} entr{unsigned.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
          <p className="mb-5 text-sm text-ink-700">
            entry เหล่านี้อ้างอิงแหล่ง authoritative + cross-check แล้ว — <b>ใช้อ้างอิงได้</b> (◆ Sourced).
            ยังไม่มี Ed25519 signature ของอาจารย์ให้ verify · ช่วยตรวจให้เลื่อนขั้นที่{' '}
            <Link href="/feedback" className="text-source-800 underline-offset-2 hover:underline">/feedback</Link>
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unsigned.map(d => (
              <li key={d.slug}>
                <Link
                  href={`/drugs/${d.slug}`}
                  className="block rounded-md border border-paper-300 bg-paper-50 p-4 text-sm transition hover:border-paper-400"
                >
                  <p className="font-medium text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{d.nameEn}</p>
                  <p className="text-[11px] italic text-ink-500" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{d.nameTh}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Latest signing events */}
      {latestSignings.length > 0 && (
        <section className="mt-16">
          <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-paper-200 pb-2.5">
            <h2 className="display-h2">Latest signing events</h2>
            <Link href="/log" className="shrink-0 text-[12px] uppercase tracking-wider text-source-800 hover:underline">
              Full log →
            </Link>
          </div>
          <ol className="space-y-2.5">
            {latestSignings.map(e => {
              const drug = findDrug(e.drugSlug)
              return (
                <li key={e.logSeq}>
                  <Link
                    href={`/verify/${e.drugSlug}`}
                    className="grid grid-cols-[60px_1fr_auto] items-baseline gap-x-4 rounded-md border border-paper-300 bg-paper-50 px-4 py-3 transition hover:border-source-500 hover:bg-paper-100/60"
                  >
                    <span className="rounded-full border border-source-400 bg-paper-50 px-2 py-0.5 text-center text-[10px] font-semibold tabular text-source-800">
                      #{e.logSeq.toString().padStart(3, '0')}
                    </span>
                    <span className="min-w-0">
                      <span className="font-medium text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                        {drug?.nameEn ?? e.drugSlug}
                      </span>
                      <span className="ml-2 text-[11px] italic text-ink-500" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                        {drug?.nameTh}
                      </span>
                      <span className="ml-2 text-[11px] text-ink-500">
                        signed by <b className="font-mono text-source-800">{e.signerId}</b>
                      </span>
                    </span>
                    <time className="shrink-0 text-[10px] tabular text-ink-500">
                      {e.signedAt.slice(0, 10)}
                    </time>
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {/* Registry hint */}
      <aside className="mt-16 rounded-md border-l-4 border-source-300 bg-source-50/40 px-6 py-5 text-sm">
        <p className="eyebrow">Public-key registry</p>
        <p className="mt-2 leading-relaxed text-ink-900">
          Keys ที่ verify เหล่านี้ commit ไว้ที่ <code className="rounded bg-paper-100 px-1 py-0.5 text-[13px]">content/keys/</code> ใน git repo —
          ดูประวัติทั้งหมด, ดูใครเพิ่ม/ลบ key เมื่อไหร่ ผ่าน{' '}
          <a href="https://github.com/palmzamak2547/cuvetsmo-source/tree/main/content/keys" className="text-source-800 underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>. ดู <Link href="/trust" className="text-source-800 underline-offset-2 hover:underline">chain of trust</Link> เต็มได้ที่ /trust.
        </p>
      </aside>
    </article>
  )
}
