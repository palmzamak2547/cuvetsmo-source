import Link from 'next/link'
import { DRUGS, pendingDrugs, publishedDrugs } from '@/lib/drugs'

export const metadata = {
  title: 'Drug Reference',
  description: 'คู่มือยาสัตวแพทย์ภาษาไทย — ทุก entry มี citation chain ที่ตรวจสอบได้และอาจารย์เซ็นต์รับ',
}

export default function DrugsList() {
  const published = publishedDrugs()
  const pending = pendingDrugs()

  return (
    <article>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-source-700">
          Drug Reference · Veterinary
        </p>
        <h1 className="mt-2 text-3xl font-bold text-paper-900">คู่มือยาสัตวแพทย์</h1>
        <p className="mt-2 text-sm text-paper-700">
          ทุก dose มี citation, ทุก entry อาจารย์เซ็นต์รับ ก่อน publish เป็น canonical
        </p>
      </header>

      {/* Status strip */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">Published</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{published.length}</p>
          <p className="text-[11px] text-emerald-800">faculty-reviewed, citable</p>
        </div>
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-700">Pending review</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{pending.length}</p>
          <p className="text-[11px] text-amber-800">mirrored from authoritative source, awaiting Thai translation + faculty signoff</p>
        </div>
      </section>

      {published.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-paper-900">Published</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {published.map(d => <DrugCard key={d.slug} drug={d} />)}
          </ul>
        </section>
      )}

      {pending.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-paper-900">Pending review</h2>
          <p className="mt-1 text-sm text-paper-700">
            Entry ที่ mirrored จาก authoritative source แล้ว แต่ยังรอ Thai translation + อาจารย์เซ็นต์รับ ·
            ห้ามใช้อ้างอิงทางคลินิก จนกว่า trust stamp เป็น emerald
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {pending.map(d => <DrugCard key={d.slug} drug={d} pending />)}
          </ul>
        </section>
      )}

      {DRUGS.length === 0 && (
        <p className="mt-8 rounded-xl border border-paper-200 bg-paper-100 p-6 text-center text-sm text-paper-700">
          ยังไม่มี entry — Phase 0 scaffolding only
        </p>
      )}
    </article>
  )
}

function DrugCard({ drug, pending }: { drug: typeof DRUGS[number]; pending?: boolean }) {
  return (
    <li>
      <Link
        href={`/drugs/${drug.slug}`}
        className={`block rounded-xl border-2 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
          pending ? 'border-amber-300 hover:border-amber-400' : 'border-emerald-300 hover:border-emerald-400'
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-source-700">{drug.class}</p>
        <h3 className="mt-1 text-lg font-bold text-paper-900">{drug.nameEn}</h3>
        <p className="text-sm text-paper-700">{drug.nameTh}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-paper-700">
          <span>📚 {drug.citations.length} citations</span>
          {drug.mirroredFrom && (
            <>
              <span>•</span>
              <span>🔗 {drug.mirroredFrom.length} source{drug.mirroredFrom.length > 1 ? 's' : ''}</span>
            </>
          )}
          {pending ? (
            <span className="ml-auto text-amber-700">⏳ pending</span>
          ) : drug.reviewedBy ? (
            <span className="ml-auto text-emerald-700">✓ {drug.reviewedBy.name}</span>
          ) : null}
        </div>
      </Link>
    </li>
  )
}
