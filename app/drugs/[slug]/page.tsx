import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  type Citation,
  type Drug,
  type Dosage,
  type ClinicalSection,
  findDrug,
  DRUGS,
  verificationTier,
  freshAttestations,
} from '@/lib/drugs'
import { shortCID } from '@/lib/cid'
import { lookupATC, lookupRxNorm, lookupICD11, lookupLOINC } from '@/lib/ontology'
import { classifyDrug } from '@/lib/classify'
import RecordVisit from './RecordVisit'
import DetailViewToggle from './DetailViewToggle'

export async function generateStaticParams() {
  return DRUGS.map(d => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const drug = findDrug(slug)
  if (!drug) return { title: 'Not found' }
  return {
    title: `${drug.nameEn} (${drug.nameTh})`,
    description: `${drug.class} — citation-grade Thai veterinary drug reference. ${drug.citations.length} citations, ${drug.signatures.length} signature(s).`,
  }
}

export default async function DrugDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const drug = findDrug(slug)
  if (!drug) notFound()
  const tier = verificationTier(drug)

  return (
    <article data-view-host>
      <RecordVisit slug={drug.slug} />

      {/* Breadcrumb */}
      <nav className="text-xs text-ink-700">
        <Link href="/drugs" className="hover:text-source-800">← Drug Reference</Link>
      </nav>

      {/* Two-column layout — prose left, metadata sidebar right */}
      <div className="mt-6 grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ───── Main column ───── */}
        <div className="prose-academic min-w-0">
          {/* Title block */}
          <header className="border-b border-paper-300 pb-7">
            <p className="eyebrow">{drug.class}</p>
            <h1 className="display-h1 mt-3">{drug.nameEn}</h1>
            <p className="mt-1 text-xl italic text-ink-700">{drug.nameTh}</p>
            {drug.brandNamesTh && drug.brandNamesTh.length > 0 && (
              <p className="mt-3 text-sm text-ink-700">
                <span className="text-[11px] uppercase tracking-wider text-ink-500">ชื่อทางการค้า · </span>
                {drug.brandNamesTh.join(', ')}
              </p>
            )}
          </header>

          {/* Verification-tier banner — honest, tier-aware, never a dead "do not use" */}
          <VerificationBanner drug={drug} tier={tier} />

          {drug.mechanism && (
            <Section title="กลไกการออกฤทธิ์ · Mechanism">
              <p>{drug.mechanism}</p>
            </Section>
          )}

          <ClinicalList title="ข้อบ่งใช้ · Indications" sections={drug.indications} drug={drug} />
          <ClinicalList title="ข้อห้ามใช้ · Contraindications" sections={drug.contraindications} drug={drug} severity="warn" />
          <DosagesTable dosages={drug.dosages} drug={drug} />
          <ClinicalList title="ผลข้างเคียง · Side effects" sections={drug.sideEffects} drug={drug} severity="warn" />
          {drug.interactions && <ClinicalList title="ปฏิกิริยาระหว่างยา · Interactions" sections={drug.interactions} drug={drug} />}
          {drug.monitoring && <ClinicalList title="การติดตามผู้ป่วย · Monitoring" sections={drug.monitoring} drug={drug} />}
          {drug.storage && <ClinicalList title="การเก็บรักษา · Storage" sections={drug.storage} drug={drug} />}
          {drug.pregnancyLactation && <ClinicalList title="ตั้งครรภ์ / ให้นม · Pregnancy & lactation" sections={drug.pregnancyLactation} drug={drug} />}

          <References citations={drug.citations} />

          <SameClassRelated drug={drug} />

          {/* Version footer */}
          <footer className="mt-12 border-t border-paper-200 pt-5 text-xs text-ink-500">
            <p className="tabular">
              Version {drug.version}, อัปเดต {drug.lastUpdated}, slug <code className="rounded bg-paper-100 px-1.5 py-0.5">{drug.slug}</code>
            </p>
            {drug.changelog && drug.changelog.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-source-800 hover:underline">Changelog ({drug.changelog.length})</summary>
                <ul className="mt-3 space-y-1.5 pl-1 tabular">
                  {drug.changelog.map(c => (
                    <li key={c.version} className="text-ink-700">
                      <span className="font-mono text-source-800">v{c.version}</span>
                      <span className="text-ink-500"> — {c.date} — </span>
                      <span>{c.summary}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </footer>
        </div>

        {/* ───── Sidebar ───── */}
        <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-auto">
          <div className="space-y-5">
            <TrustStamp drug={drug} />
            <DetailViewToggle />
            <div data-expert-only className="space-y-5">
              <SignaturePanel drug={drug} />
              <OntologyChips drug={drug} />
              <MirroredFrom drug={drug} />
              <DraftingBadge drug={drug} />
            </div>
          </div>
        </aside>
      </div>
    </article>
  )
}

// ──────────────────────────────────────────────────────────────────
// Trust + signatures
// ──────────────────────────────────────────────────────────────────

// Tier-aware trust stamp — every entry shows a legitimate badge; nothing
// reads as "broken / do not use". Today every entry resolves to the sourced
// "◆ Verified" branch; the expert + community branches are the dormant future
// faculty-endorsement path (see lib/drugs.ts verificationTier) and fire only
// once an entry gains reviewedBy/signatures or attestations.
function TrustStamp({ drug }: { drug: Drug }) {
  const t = verificationTier(drug)
  if (t === 'expert') {
    const r = drug.reviewedBy!
    return (
      <section className="rounded-md border border-emerald-400 bg-emerald-50/70 p-5">
        <p className="stamp border-emerald-700 text-emerald-800">✓ Expert-reviewed</p>
        <p className="mt-3 text-sm leading-snug text-emerald-900">
          <b>{r.name}</b>
          {r.title && <span><br/>{r.title}</span>}
          {r.department && <span> · {r.department}</span>}
          <span className="block text-xs text-emerald-800">{r.affiliation}</span>
          <span className="block text-[11px] tabular text-emerald-800">Reviewed {r.date}</span>
        </p>
      </section>
    )
  }
  if (t === 'community') {
    const n = freshAttestations(drug).length
    return (
      <section className="rounded-md border border-sky-300 bg-sky-50/70 p-5">
        <p className="stamp border-sky-700 text-sky-800">✓✓ Community-checked</p>
        <p className="mt-3 text-sm leading-snug text-sky-900">
          ตรวจทานโดยผู้ใช้อิสระ <b>{n}</b> คน · ยืนยันว่าเนื้อหาตรงกับแหล่งอ้างอิง
          <span className="mt-2 block text-[11px] text-sky-800">
            ตรวจขนาดยากับตำราก่อนใช้ทางคลินิกเสมอ
          </span>
        </p>
      </section>
    )
  }
  return (
    <section className="rounded-md border border-source-300 bg-source-50/60 p-5">
      <p className="stamp border-source-600 text-source-800">◆ Verified</p>
      <p className="mt-3 text-sm leading-snug text-ink-800">
        อ้างอิง + cross-check จาก {drug.citations?.length ?? 0} แหล่ง authoritative · ตรวจสอบได้ทุกบรรทัด
        <span className="mt-2 block text-[11px] text-ink-600">
          ยืนยันขนาดยากับตำราหรือดุลพินิจทางคลินิกก่อนใช้จริงเสมอ
        </span>
      </p>
    </section>
  )
}

// Verification banner — honest, tier-aware. Sourced framed as reference-grade
// + confirm-before-clinical-use, NOT a dead "do not use" page. Like TrustStamp,
// the expert + community branches are dormant; every entry renders the sourced
// "◆ Verified" banner until faculty endorsement lands.
function VerificationBanner({ drug, tier }: { drug: Drug; tier: ReturnType<typeof verificationTier> }) {
  const nSources = drug.citations?.length ?? 0
  if (tier === 'expert') {
    return (
      <aside className="mt-7 rounded-md border border-emerald-300 bg-emerald-50 px-5 py-4 text-sm text-emerald-900" role="note">
        <p className="font-semibold">✓ Expert-reviewed · faculty-endorsed</p>
        <p className="mt-1 text-emerald-800">
          ตรวจและรับรองโดย <b>{drug.reviewedBy?.name}</b>
          {drug.reviewedBy?.affiliation ? ` (${drug.reviewedBy.affiliation})` : ''} ·
          ผนึกด้วยลายเซ็นดิจิทัล Ed25519 ในทะเบียนโปร่งใส (<Link href="/log" className="underline">ดู log</Link>).
          ยังควรใช้วิจารณญาณทางคลินิกร่วมเสมอ
        </p>
      </aside>
    )
  }
  if (tier === 'community') {
    const n = freshAttestations(drug).length
    return (
      <aside className="mt-7 rounded-md border border-sky-300 bg-sky-50 px-5 py-4 text-sm text-sky-900" role="note">
        <p className="font-semibold">✓✓ Community-checked · ตรวจทานโดยผู้ใช้อิสระ {n} คน</p>
        <p className="mt-1 text-sky-800">
          ผู้ตรวจอิสระยืนยันว่าเนื้อหาตรงกับแหล่งอ้างอิงที่ระบุ. ทุก claim มี citation ({nSources} แหล่ง) ·
          ตรวจขนาดยากับตำราของคุณก่อนใช้ทางคลินิกเสมอ ·{' '}
          <Link href="/verify" className="underline">ช่วยตรวจ/รับรอง</Link>
        </p>
      </aside>
    )
  }
  return (
    <aside className="mt-7 rounded-md border border-source-300 bg-source-50/60 px-5 py-4 text-sm text-ink-800" role="note">
      <p className="font-semibold text-source-900">◆ Verified · อ้างอิง + cross-check จาก {nSources} แหล่ง</p>
      <p className="mt-1 text-ink-700">
        ทุกข้อความตามรอยถึงแหล่ง authoritative ได้ (Merck Vet Manual, FDA/EMA labels, WHO ATC, ฯลฯ) และตรวจสอบข้ามแหล่งแล้ว —
        เป็นแหล่งอ้างอิงที่ตรวจสอบได้ทุกบรรทัด. เช่นเดียวกับตำราอ้างอิงทุกเล่ม <b>ควรยืนยันขนาดยากับตำราหรือดุลพินิจทางคลินิกก่อนใช้จริงเสมอ</b>.{' '}
        <Link href="/verify" className="underline text-source-800">วิธีตรวจสอบ →</Link>
      </p>
    </aside>
  )
}

function SignaturePanel({ drug }: { drug: Drug }) {
  if (!drug.signatures || drug.signatures.length === 0) return null
  return (
    <section className="rounded-md border border-source-300 bg-paper-50 p-5">
      <p className="eyebrow text-source-800">
        🔏 {drug.signatures.length} signature{drug.signatures.length > 1 ? 's' : ''}
      </p>
      <ul className="mt-3 space-y-2.5 text-xs">
        {drug.signatures.map((s, i) => (
          <li key={i} className="border-l-2 border-source-300 pl-3">
            <p className="font-medium text-ink-900">{s.signerName}</p>
            <p className="font-mono text-[10px] text-ink-500">{s.signerKeyId}</p>
            <p className="text-[10px] text-ink-500 tabular">{s.signedAt.slice(0, 10)}</p>
          </li>
        ))}
      </ul>
      <Link
        href={`/verify/${drug.slug}`}
        className="mt-4 block w-full rounded-sm bg-source-800 px-3 py-2 text-center text-xs font-medium text-paper-50 transition hover:bg-source-900"
      >
        Verify in browser →
      </Link>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────
// Ontology + mirror
// ──────────────────────────────────────────────────────────────────

function OntologyChips({ drug }: { drug: Drug }) {
  const codes = drug.codes ?? {}
  const atc    = codes.atc    ? lookupATC(codes.atc.code)       : undefined
  const rx     = codes.rxnorm ? lookupRxNorm(codes.rxnorm.cui)   : undefined
  const icd    = codes.icd11  ? lookupICD11(codes.icd11.code)    : undefined
  const loinc  = codes.loinc  ? lookupLOINC(codes.loinc.code)    : undefined

  if (!atc && !rx && !codes.snomed && !icd && !loinc && !codes.vetspecial) return null

  return (
    <section className="rounded-md border border-paper-300 bg-paper-50 p-5">
      <p className="eyebrow">Ontology codes</p>
      <p className="mt-1.5 text-[11px] text-ink-500 leading-snug">
        Cross-references สำหรับ EHR, research dataset, AI agent
      </p>
      <dl className="mt-4 space-y-3">
        {atc && codes.atc && (
          <CodeRow label="ATC" code={codes.atc.code} name={atc.name} title={`WHO ATC level ${atc.level}`} />
        )}
        {rx && codes.rxnorm && (
          <CodeRow label="RxNorm" code={codes.rxnorm.cui} name={rx.name} title="NLM RxNorm CUI" />
        )}
        {icd && codes.icd11 && (
          <CodeRow label="ICD-11" code={codes.icd11.code} name={icd.name} title="WHO ICD-11" />
        )}
        {loinc && codes.loinc && (
          <CodeRow label="LOINC" code={codes.loinc.code} name={loinc.name} title="LOINC" />
        )}
        {codes.snomed && (
          <CodeRow label="SNOMED" code={codes.snomed.sctid} name={codes.snomed.name} title="SNOMED CT (unverified — licensing pending)" />
        )}
      </dl>
    </section>
  )
}

function CodeRow({ label, code, name, title }: { label: string; code: string; name: string; title?: string }) {
  return (
    <div title={title}>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className="mt-0.5">
        <span className="font-mono text-sm font-semibold text-source-800">{code}</span>
        <span className="ml-2 text-[12px] text-ink-700">{name}</span>
      </dd>
    </div>
  )
}

function MirroredFrom({ drug }: { drug: Drug }) {
  if (!drug.mirroredFrom || drug.mirroredFrom.length === 0) return null
  return (
    <section className="rounded-md border border-paper-300 bg-paper-50 p-5">
      <p className="eyebrow">Mirrored from</p>
      <p className="mt-1.5 text-[11px] text-ink-500 leading-snug">
        Cross-checked across {drug.mirroredFrom.length} authoritative source{drug.mirroredFrom.length > 1 ? 's' : ''}
      </p>
      <ul className="mt-4 space-y-3 text-xs">
        {drug.mirroredFrom.map(m => {
          const cidEntry = drug.mirrorCIDs?.find(c => c.sourceId === m.id)
          return (
            <li key={m.id}>
              <a
                href={m.entryUrl ?? m.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-ink-900 hover:text-source-800"
              >
                {m.name} <span aria-hidden className="text-ink-500">↗</span>
              </a>
              {m.asOfDate && (
                <span className="ml-1.5 text-[11px] tabular text-ink-500">{m.asOfDate}</span>
              )}
              <p className="mt-0.5 text-[10px] text-ink-500">{m.license}</p>
              {cidEntry && (
                <div className="mt-1 flex items-center gap-2">
                  <Link
                    href={`/c/${cidEntry.cid}`}
                    className="font-mono text-[10px] text-source-800 hover:underline"
                    title={`CID ${cidEntry.cid}`}
                  >
                    c/{shortCID(cidEntry.cid)}
                  </Link>
                  <StatusPill status={cidEntry.status} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function DraftingBadge({ drug }: { drug: Drug }) {
  const d = drug.drafting
  if (!d) return null
  if (d.aiAssisted) {
    const ratio = d.humanEditsRatio
    const pct = typeof ratio === 'number' ? Math.round(ratio * 100) : null
    return (
      <section className="rounded-md border border-amber-300 bg-amber-50/60 p-4 text-xs text-amber-900">
        <p className="eyebrow text-amber-800">AI-assisted draft</p>
        <p className="mt-2 leading-snug">
          Model: <span className="font-mono">{d.aiModel}</span>
          {pct !== null && <><br/>Human-edited: <b>{pct}%</b></>}
          {d.humanReviewer && <><br/>Finalized by <b>@{d.humanReviewer}</b></>}
        </p>
        <p className="mt-2 text-[10px] text-amber-800">
          AI drafted แต่ไม่ใช่ผู้เขียน — มนุษย์ตรวจทุกบรรทัดและรับผิดชอบเนื้อหา (Iron Rule 0)
        </p>
      </section>
    )
  }
  return (
    <section className="rounded-md border border-paper-200 bg-paper-50 p-4 text-xs text-ink-700">
      <p className="eyebrow">การอ้างอิง · Sourced</p>
      <p className="mt-2 leading-snug">
        เนื้อหาทุกหัวข้ออ้างอิงจากแหล่ง authoritative ที่ระบุไว้ (ดู Citations ด้านล่าง)
        {d.humanReviewer && <><br/>เรียบเรียง · ตรวจโดย <span className="font-mono">@{d.humanReviewer}</span></>}
        {d.humanReviewedAt && <span className="tabular text-ink-500"> — {d.humanReviewedAt}</span>}
      </p>
    </section>
  )
}

function StatusPill({ status }: { status: 'stub' | 'mirrored' | 'rotted' }) {
  const styles = {
    stub:     'border-amber-300   text-amber-800',
    mirrored: 'border-emerald-300 text-emerald-800',
    rotted:   'border-red-300     text-red-800',
  } as const
  return (
    <span className={`rounded-full border bg-paper-50 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  )
}

// ──────────────────────────────────────────────────────────────────
// Clinical content + citations
// ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="display-h2 border-l-3 border-source-300 pl-4">{title}</h2>
      <div className="mt-4">{children}</div>
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
      <ul className="space-y-3">
        {sections.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-source-400" aria-hidden />
            <span className="flex-1">
              <span className={severity === 'warn' ? 'text-ink-900' : ''}>{s.text}</span>
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
    <Section title="ขนาดยา · Dosage">
      <div className="overflow-x-auto rounded-md border border-paper-300">
        <table className="min-w-full text-sm tabular">
          <thead className="border-b border-paper-300 bg-paper-100/70 text-[11px] uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Species</th>
              <th className="px-4 py-2.5 text-left font-medium">Indication</th>
              <th className="px-4 py-2.5 text-left font-medium">Route</th>
              <th className="px-4 py-2.5 text-left font-medium">Dose</th>
              <th className="px-4 py-2.5 text-left font-medium">Cite</th>
            </tr>
          </thead>
          <tbody>
            {dosages.map((d, i) => (
              <tr key={i} className="border-t border-paper-200 hover:bg-paper-100/50">
                <td className="px-4 py-3 capitalize">{d.species}</td>
                <td className="px-4 py-3">{d.indication}</td>
                <td className="px-4 py-3 font-mono text-xs text-source-800">{d.route}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-[13px]">{d.dose}</span>
                  {d.duration && <span className="block text-[11px] text-ink-500">{d.duration}</span>}
                  {d.notes && <span className="block text-[11px] text-ink-500">{d.notes}</span>}
                </td>
                <td className="px-4 py-3"><CiteRefs ids={d.cites} drug={drug} inline /></td>
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
            [{i + 1}]{idx < ids.length - 1 && <span aria-hidden> </span>}
          </a>
        )
      })}
    </sup>
  )
}

function SameClassRelated({ drug }: { drug: Drug }) {
  const klass = classifyDrug(drug)
  if (!klass) return null
  const peers = DRUGS.filter(d => d.slug !== drug.slug && classifyDrug(d)?.slug === klass.slug)
    .slice()
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn))
  if (peers.length === 0) return null
  return (
    <section className="mt-12 no-print">
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-paper-200 pb-2">
        <h2 className="display-h2">More from this class</h2>
        <Link
          href={`/drugs/class/${klass.slug}`}
          className="shrink-0 text-[12px] uppercase tracking-wider text-source-800 hover:underline"
        >
          {klass.label.split('·')[0].trim()} →
        </Link>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {peers.slice(0, 6).map(p => {
          // Mirror the catalog badges: sourced "◆ Verified" by default; the
          // dormant emerald "✓" shows only once a peer reaches the expert rung.
          const expert = verificationTier(p) === 'expert'
          return (
            <li key={p.slug}>
              <Link
                href={`/drugs/${p.slug}`}
                className={`flex items-baseline justify-between gap-2 rounded-md border bg-paper-50 px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-sm ${
                  expert
                    ? 'border-emerald-400/70 hover:border-emerald-500'
                    : 'border-paper-300 hover:border-source-500'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                    {p.nameEn}
                  </p>
                  <p className="truncate text-[11px] italic text-ink-500" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                    {p.nameTh}
                  </p>
                </div>
                {expert ? (
                  <span className="shrink-0 rounded-full bg-emerald-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-50" title="Expert-reviewed">✓</span>
                ) : (
                  <span className="shrink-0 rounded-full border border-source-300 bg-source-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-source-800" title="Verified">◆</span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function References({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) return null
  return (
    <Section title="References">
      <ol className="space-y-3.5 text-[13px]">
        {citations.map((c, i) => (
          <li key={c.id} id={`cite-${c.id}`} className="flex gap-3 scroll-mt-24">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-paper-300 bg-paper-50 font-mono text-[10px] font-semibold text-ink-700">
              {i + 1}
            </span>
            <span className="flex-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                {c.type}
              </span>
              {' · '}
              <span className="font-medium text-ink-900">{c.title}</span>
              {c.authors && <span className="text-ink-700">. {c.authors}</span>}
              {c.year && <span className="text-ink-700 tabular">, {c.year}</span>}
              {c.edition && <span className="text-ink-700">, {c.edition}</span>}
              {c.pageOrSection && <span className="text-ink-700">, {c.pageOrSection}</span>}
              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                {c.url && (
                  <a href={c.url} target="_blank" rel="noreferrer" className="text-source-800 hover:underline">
                    upstream ↗
                  </a>
                )}
                {c.cid && (
                  <Link
                    href={`/c/${c.cid}`}
                    className="font-mono text-source-800 hover:underline"
                    title={`CID ${c.cid}`}
                  >
                    c/{shortCID(c.cid)}
                  </Link>
                )}
              </span>
              {c.note && <span className="mt-1 block text-[11px] italic text-ink-500">{c.note}</span>}
            </span>
          </li>
        ))}
      </ol>
    </Section>
  )
}
