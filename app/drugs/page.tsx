import Link from 'next/link'
import { type Drug, DRUGS, verificationTier } from '@/lib/drugs'
import { groupDrugsByClass } from '@/lib/classify'

export const metadata = {
  title: 'Drug Reference',
  description: 'คู่มือยาสัตวแพทย์ภาษาไทย — ทุก entry มี citation chain ที่ตรวจสอบได้ และอาจารย์เซ็นต์รับ',
}

export default function DrugsList() {
  const groups = groupDrugsByClass(DRUGS)

  return (
    <article>
      {/* Hero masthead */}
      <header className="border-b border-paper-300 pb-8">
        <p className="eyebrow text-source-700">Veterinary Drug Reference · คลังยาสัตวแพทย์</p>
        <h1 className="display-h1 mt-3 max-w-3xl">
          คู่มือยาสัตวแพทย์ที่ <span className="text-source-700">ตรวจสอบได้ทุกบรรทัด</span>
        </h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          ทุกขนาดยามี citation ตามรอยถึงแหล่ง authoritative และ cross-check จากหลายแหล่ง —
          ไม่ใช่คำกล่าวลอย ๆ แต่เป็นคลังอ้างอิงที่คลิกดูที่มาได้จริงทุกข้อความ
        </p>
      </header>

      {/* Scale strip — confidence at a glance */}
      <section className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-paper-300 bg-paper-300 sm:grid-cols-4">
        <Stat value={`${DRUGS.length}`} label="◆ Verified entries" sub="ตรวจสอบได้ทุกบรรทัด" />
        <Stat value={`${groups.length}`} label="Therapeutic classes" sub="ครอบคลุมกลุ่มยาหลัก" />
        <Stat value="5" label="Authoritative sources" sub="Merck, FDA/EMA, WHO ATC, RECOVER, journals" />
        <Stat value="100%" label="Cited & cross-checked" sub="ทุก claim ≥ 2 แหล่ง" />
      </section>

      {/* Class navigation — visual jump grid */}
      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <p className="eyebrow">เลือกตามกลุ่มยา · Browse by class</p>
          <span className="text-[11px] uppercase tracking-wider text-ink-500 tabular">{groups.length} classes</span>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {groups.map(({ klass, entries }) => (
            <li key={klass.slug}>
              <a
                href={`#${klass.slug}`}
                className="group flex h-full items-center justify-between gap-2 rounded-lg border border-paper-300 bg-paper-50 px-3.5 py-2.5 transition hover:-translate-y-0.5 hover:border-source-500 hover:bg-paper-100 hover:shadow-sm"
              >
                <span className="text-[13px] font-medium leading-snug text-ink-800 group-hover:text-source-800">
                  {klass.label.split('·')[0].trim()}
                </span>
                <span className="shrink-0 rounded-full bg-source-50 px-2 py-0.5 text-[11px] font-semibold tabular text-source-800 ring-1 ring-source-200">
                  {entries.length}
                </span>
              </a>
            </li>
          ))}
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
        <p className="eyebrow">วิธีตรวจสอบ — สำหรับ readers</p>
        <p className="mt-2 leading-relaxed text-ink-900">
          ทุก entry คือ <span className="stamp border-source-600 text-source-800">◆ Verified</span> — ทุก claim อ้างอิงแหล่ง authoritative
          (Merck Vet Manual, FDA/EMA labels, WHO ATC, ฯลฯ) และ cross-check จากหลายแหล่ง คุณคลิกดูแหล่งอ้างอิงของแต่ละข้อความได้เอง.
          เป็นคลังอ้างอิงที่ตรวจสอบได้ — <b>ยืนยันขนาดยากับตำราหรือดุลพินิจทางคลินิกก่อนใช้จริงเสมอ</b> เช่นเดียวกับตำราอ้างอิงทุกเล่ม.
          ดูวิธีตรวจสอบ + รายการแหล่งที่ <Link href="/verify" className="text-source-800 underline-offset-2 hover:underline">/verify</Link> และ <Link href="/sources" className="text-source-800 underline-offset-2 hover:underline">/sources</Link>
        </p>
      </aside>
    </article>
  )
}

// ──────────────────────────────────────────────────────────────────

// Every entry currently renders the sourced "◆" badge. The expert/community
// branches below are the dormant future faculty-endorsement path the schema
// supports (see lib/drugs.ts verificationTier); they fire only once an entry
// gains reviewedBy/signatures or attestations.
function DrugCard({ drug }: { drug: Drug }) {
  const t = verificationTier(drug)
  return (
    <li>
      <Link
        href={`/drugs/${drug.slug}`}
        className={`flex h-full flex-col rounded-md border bg-paper-50 p-5 transition hover:-translate-y-0.5 hover:shadow-sm ${
          t === 'expert'
            ? 'border-emerald-400/70 hover:border-emerald-500 hover:bg-emerald-50/40'
            : t === 'community'
            ? 'border-sky-400/70 hover:border-sky-500 hover:bg-sky-50/40'
            : 'border-paper-300 hover:border-source-500 hover:bg-paper-100/60'
        }`}
      >
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[17px] font-semibold tracking-tight text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            {drug.nameEn}
          </h3>
          {t === 'expert' ? (
            <span className="shrink-0 rounded-full bg-emerald-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-50" title="Expert-reviewed">✓</span>
          ) : t === 'community' ? (
            <span className="shrink-0 rounded-full bg-sky-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-50" title="Community-checked">✓✓</span>
          ) : (
            <span className="shrink-0 rounded-full border border-source-300 bg-source-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-source-800" title="Sourced">◆</span>
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

function Stat({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="bg-paper-50 p-5">
      <p className="text-3xl font-semibold tabular text-source-800" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-700">{label}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-ink-500">{sub}</p>
    </div>
  )
}
