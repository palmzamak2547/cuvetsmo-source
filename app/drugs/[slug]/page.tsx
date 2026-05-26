import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  type Citation,
  type Drug,
  type Dosage,
  type ClinicalSection,
  findDrug,
  DRUGS,
} from '@/lib/drugs'

export async function generateStaticParams() {
  return DRUGS.map(d => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const drug = findDrug(slug)
  if (!drug) return { title: 'Not found' }
  return {
    title: `${drug.nameEn} (${drug.nameTh})`,
    description: `${drug.class} — citation-grade Thai veterinary drug reference. ${drug.citations.length} citations.`,
  }
}

export default async function DrugDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const drug = findDrug(slug)
  if (!drug) notFound()

  return (
    <article className="prose-academic max-w-3xl">
      <p className="text-sm">
        <Link href="/drugs" className="text-source-700 hover:underline">← Drug Reference</Link>
      </p>

      <header className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-source-700">{drug.class}</p>
        <h1 className="mt-1 text-3xl font-bold text-paper-900">{drug.nameEn}</h1>
        <p className="text-lg text-paper-700">{drug.nameTh}</p>
        {drug.brandNamesTh && drug.brandNamesTh.length > 0 && (
          <p className="mt-1 text-sm text-paper-700">
            ชื่อทางการค้า: {drug.brandNamesTh.join(', ')}
          </p>
        )}
      </header>

      <TrustStamp drug={drug} />

      {drug.mirroredFrom && drug.mirroredFrom.length > 0 && (
        <section className="mt-6 rounded-xl border border-paper-200 bg-paper-100 p-4">
          <h2 className="text-sm font-semibold text-paper-900">📥 Mirrored from</h2>
          <ul className="mt-2 space-y-1 text-xs text-paper-700">
            {drug.mirroredFrom.map(m => (
              <li key={m.id}>
                <a href={m.entryUrl ?? m.url} target="_blank" rel="noreferrer" className="text-source-700 hover:underline">
                  {m.name}
                </a>
                {m.asOfDate && <span> · as of {m.asOfDate}</span>}
                <span className="block text-paper-700/70">License: {m.license}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {drug.mechanism && (
        <Section title="กลไกการออกฤทธิ์">
          <p>{drug.mechanism}</p>
        </Section>
      )}

      <ClinicalList title="ข้อบ่งใช้" sections={drug.indications} drug={drug} />
      <ClinicalList title="ข้อห้ามใช้" sections={drug.contraindications} drug={drug} severity="warn" />
      <DosagesTable dosages={drug.dosages} drug={drug} />
      <ClinicalList title="ผลข้างเคียง" sections={drug.sideEffects} drug={drug} severity="warn" />
      {drug.interactions && <ClinicalList title="ปฏิกิริยาระหว่างยา" sections={drug.interactions} drug={drug} />}
      {drug.monitoring && <ClinicalList title="การติดตามผู้ป่วย" sections={drug.monitoring} drug={drug} />}
      {drug.storage && <ClinicalList title="การเก็บรักษา" sections={drug.storage} drug={drug} />}
      {drug.pregnancyLactation && <ClinicalList title="ตั้งครรภ์ / ให้นม" sections={drug.pregnancyLactation} drug={drug} />}

      <References citations={drug.citations} />

      <footer className="mt-10 rounded-xl border border-paper-200 bg-paper-100 p-4 text-xs text-paper-700">
        Version {drug.version} · อัปเดต {drug.lastUpdated} · slug <code>{drug.slug}</code>
        {drug.changelog && drug.changelog.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-source-700 hover:underline">Changelog</summary>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {drug.changelog.map(c => (
                <li key={c.version}>v{c.version} · {c.date} · {c.summary}</li>
              ))}
            </ul>
          </details>
        )}
      </footer>
    </article>
  )
}

function TrustStamp({ drug }: { drug: Drug }) {
  if (!drug.reviewedBy) {
    return (
      <div className="mt-6 rounded-xl border-2 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-bold">⏳ PENDING REVIEW · NOT FOR CLINICAL USE</p>
        <p className="mt-1">
          Entry นี้ mirrored จากแหล่งอ้างอิงแต่ยังไม่ผ่านการตรวจสอบของอาจารย์ผู้เชี่ยวชาญ ·
          ห้ามนำไปใช้อ้างอิงทางคลินิก · เนื้อหา Thai translation อาจมี TEMPLATE placeholder
        </p>
      </div>
    )
  }
  const r = drug.reviewedBy
  return (
    <div className="mt-6 rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4 text-sm text-emerald-900">
      <p className="font-bold">✓ Faculty-reviewed</p>
      <p className="mt-1">
        ตรวจโดย <b>{r.name}</b>
        {r.title && <span> · {r.title}</span>}
        {r.department && <span> · {r.department}</span>}
        <span> · {r.affiliation}</span>
        <span> · {r.date}</span>
      </p>
      <p className="mt-1 text-xs text-emerald-800">
        Citations: {drug.citations.length} · Version {drug.version}
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-paper-900">{title}</h2>
      <div className="mt-2 text-paper-800">{children}</div>
    </section>
  )
}

function ClinicalList({
  title,
  sections,
  drug,
  severity,
}: {
  title: string
  sections: ClinicalSection[]
  drug: Drug
  severity?: 'warn'
}) {
  if (sections.length === 0) return null
  return (
    <Section title={title}>
      <ul className={`mt-1 space-y-2 ${severity === 'warn' ? 'text-paper-900' : 'text-paper-800'}`}>
        {sections.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-paper-300" aria-hidden>•</span>
            <span className="flex-1">
              {s.text}
              <CiteRefs ids={s.cites} drug={drug} />
            </span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function DosagesTable({ dosages, drug }: { dosages: Dosage[]; drug: Drug }) {
  if (dosages.length === 0) return null
  return (
    <Section title="ขนาดยา">
      <div className="mt-1 overflow-x-auto rounded-xl border border-paper-200">
        <table className="min-w-full text-sm">
          <thead className="bg-paper-100">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-paper-900">Species</th>
              <th className="px-3 py-2 text-left font-semibold text-paper-900">Indication</th>
              <th className="px-3 py-2 text-left font-semibold text-paper-900">Route</th>
              <th className="px-3 py-2 text-left font-semibold text-paper-900">Dose</th>
              <th className="px-3 py-2 text-left font-semibold text-paper-900">Cite</th>
            </tr>
          </thead>
          <tbody>
            {dosages.map((d, i) => (
              <tr key={i} className="border-t border-paper-200">
                <td className="px-3 py-2 capitalize">{d.species}</td>
                <td className="px-3 py-2">{d.indication}</td>
                <td className="px-3 py-2 font-mono text-xs">{d.route}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {d.dose}
                  {d.duration && <span className="block text-[10px] text-paper-700">{d.duration}</span>}
                  {d.notes && <span className="block text-[10px] text-paper-700">{d.notes}</span>}
                </td>
                <td className="px-3 py-2"><CiteRefs ids={d.cites} drug={drug} inline /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

function CiteRefs({ ids, drug, inline }: { ids: string[]; drug: Drug; inline?: boolean }) {
  if (ids.length === 0) return null
  return (
    <sup className={inline ? '' : 'ml-1'}>
      {ids.map((id, idx) => {
        const i = drug.citations.findIndex(c => c.id === id)
        if (i < 0) return <span key={id} className="text-amber-600">[?]</span>
        return (
          <a key={id} href={`#cite-${id}`} className="cite-token" aria-label={`citation ${i + 1}`}>
            [{i + 1}]{idx < ids.length - 1 && ' '}
          </a>
        )
      })}
    </sup>
  )
}

function References({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) return null
  return (
    <Section title="References">
      <ol className="mt-1 list-decimal space-y-2 pl-5 text-xs">
        {citations.map(c => (
          <li key={c.id} id={`cite-${c.id}`}>
            <span className="inline-flex items-center rounded-full border border-paper-300 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-paper-700">
              {c.type}
            </span>{' '}
            <span className="font-medium text-paper-900">{c.title}</span>
            {c.authors && <span>. {c.authors}</span>}
            {c.year && <span>, {c.year}</span>}
            {c.edition && <span>, {c.edition}</span>}
            {c.pageOrSection && <span>, {c.pageOrSection}</span>}
            {c.url && (
              <>
                {' · '}
                <a href={c.url} target="_blank" rel="noreferrer" className="text-source-700 hover:underline">link</a>
              </>
            )}
            {c.note && <span className="block text-paper-700">— {c.note}</span>}
          </li>
        ))}
      </ol>
    </Section>
  )
}
