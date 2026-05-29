import Link from 'next/link'
import { type Drug, DRUGS, pendingDrugs, publishedDrugs } from '@/lib/drugs'
import { THERAPEUTIC_CLASSES, groupDrugsByClass } from '@/lib/classify'

export const metadata = {
  title: 'Drug Reference',
  description: 'คู่มือยาสัตวแพทย์ภาษาไทย — ทุก entry มี citation chain ที่ตรวจสอบได้ และอาจารย์เซ็นต์รับ',
}

export default function DrugsList() {
  const published = publishedDrugs()
  const pending = pendingDrugs()
  const groups = groupDrugsByClass(DRUGS)

  return (
    <article>
      <header className="border-b border-paper-300 pb-7">
        <p className="eyebrow">Drug Reference · Veterinary</p>
        <h1 className="display-h1 mt-3">คู่มือยาสัตวแพทย์</h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          ทุก dose มี citation, ทุก entry อาจารย์เซ็นต์รับด้วย Ed25519 ก่อน publish เป็น canonical.
          คุณ verify ในเครื่องตัวเองได้ทุก signature โดยไม่ต้องเชื่อ server ของเรา
        </p>
      </header>

      {/* Status summary */}
      <section className="mt-8 grid gap-px overflow-hidden rounded-md border border-paper-300 bg-paper-300 sm:grid-cols-3">
        <Tile
          label="Canonical"
          value={published.length}
          sub="faculty-reviewed + Ed25519 signed"
          tone="emerald"
        />
        <Tile
          label="Pending review"
          value={pending.length}
          sub="mirrored, awaiting Thai translation + signoff"
          tone="amber"
        />
        <Tile
          label="Total seeded"
          value={DRUGS.length}
          sub="all with cross-checked provenance metadata"
          tone="source"
        />
      </section>

      {/* Quick class navigation */}
      <section className="mt-10">
        <p className="eyebrow">Browse by therapeutic class</p>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {THERAPEUTIC_CLASSES.map(c => {
            const count = DRUGS.filter(d => c.match(d)).length
            if (count === 0) return null
            return (
              <li key={c.slug}>
                <Link
                  href={`/drugs/class/${c.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-paper-300 bg-paper-50 px-3 py-1.5 text-[12px] text-ink-700 transition hover:border-source-500 hover:bg-paper-100 hover:text-source-800"
                >
                  <span>{c.label.split('·')[0].trim()}</span>
                  <span className="rounded-full bg-paper-200 px-1.5 py-px text-[10px] font-semibold tabular text-ink-700">
                    {count}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Class-grouped index */}
      {groups.length > 0 ? (
        <section className="mt-12 space-y-12">
          {groups.map(({ klass, entries }) => (
            <div key={klass.slug} id={klass.slug}>
              <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-paper-200 pb-2.5">
                <h2 className="display-h2 text-source-900">
                  <Link href={`/drugs/class/${klass.slug}`} className="hover:underline underline-offset-4">
                    {klass.label}
                  </Link>
                </h2>
                <p className="text-[11px] uppercase tracking-wider text-ink-500 tabular">
                  {entries.length} entries
                </p>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map(d => <DrugCard key={d.slug} drug={d} />)}
              </ul>
            </div>
          ))}
        </section>
      ) : (
        <section className="mt-12 rounded-md border border-paper-300 bg-paper-50 p-10 text-center">
          <p className="eyebrow">No entries yet</p>
          <p className="mt-2 text-ink-700">Phase 0 scaffold pending content seed.</p>
        </section>
      )}

      {/* Methodology hint */}
      <aside className="mt-16 rounded-md border-l-4 border-source-300 bg-source-50/40 px-6 py-5 text-sm">
        <p className="eyebrow">Iron Rule 0 — สำหรับ readers</p>
        <p className="mt-2 leading-relaxed text-ink-900">
          Entry ที่ <span className="stamp border-amber-700 text-amber-800">⏳ pending</span> = mirrored จาก authoritative source แล้ว
          แต่ยังไม่ผ่านการตรวจสอบของอาจารย์ผู้เชี่ยวชาญ — <b>ห้ามใช้อ้างอิงทางคลินิก</b>.
          Entry ที่ <span className="stamp border-emerald-700 text-emerald-800">✓ canonical</span> = faculty-reviewed
          + Ed25519 signed, ดู signature ของอาจารย์คนไหนได้ที่ <Link href="/verify" className="text-source-800 underline-offset-2 hover:underline">/verify</Link>
        </p>
      </aside>
    </article>
  )
}

// ──────────────────────────────────────────────────────────────────

function DrugCard({ drug }: { drug: Drug }) {
  const canonical = drug.reviewedBy !== null && drug.signatures.length > 0
  return (
    <li>
      <Link
        href={`/drugs/${drug.slug}`}
        className={`flex h-full flex-col rounded-md border bg-paper-50 p-5 transition hover:-translate-y-0.5 hover:shadow-sm ${
          canonical
            ? 'border-emerald-400/70 hover:border-emerald-500 hover:bg-emerald-50/40'
            : 'border-paper-300 hover:border-source-500 hover:bg-paper-100/60'
        }`}
      >
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[17px] font-semibold tracking-tight text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            {drug.nameEn}
          </h3>
          {canonical ? (
            <span className="shrink-0 rounded-full bg-emerald-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-50">✓</span>
          ) : (
            <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-800">⏳</span>
          )}
        </div>
        <p className="text-[13px] italic text-ink-700" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{drug.nameTh}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] tabular text-ink-500">
          {drug.codes?.atc && (
            <span className="rounded border border-source-300/60 bg-paper-100 px-1.5 py-0.5 font-mono text-source-800">
              {drug.codes.atc.code}
            </span>
          )}
          {drug.codes?.rxnorm && (
            <span className="rounded border border-source-300/60 bg-paper-100 px-1.5 py-0.5 font-mono text-source-800">
              RxNorm {drug.codes.rxnorm.cui}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-500">
          <span>{drug.citations.length} citation{drug.citations.length === 1 ? '' : 's'}</span>
          {drug.mirroredFrom && drug.mirroredFrom.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>{drug.mirroredFrom.length} source{drug.mirroredFrom.length === 1 ? '' : 's'}</span>
            </>
          )}
          {drug.signatures.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="text-source-800">🔏 {drug.signatures.length}</span>
            </>
          )}
        </div>
      </Link>
    </li>
  )
}

function Tile({ label, value, sub, tone }: { label: string; value: number; sub: string; tone: 'emerald' | 'amber' | 'source' }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-900',
    amber:   'bg-amber-50 text-amber-900',
    source:  'bg-paper-50 text-source-900',
  } as const
  return (
    <div className={`p-6 ${colors[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{value}</p>
      <p className="mt-1 text-[11px] opacity-70 leading-snug">{sub}</p>
    </div>
  )
}
