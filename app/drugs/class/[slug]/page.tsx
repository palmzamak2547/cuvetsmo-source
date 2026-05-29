// /drugs/class/[slug] — therapeutic-class filtered view.
//
// e.g. /drugs/class/nsaids shows only NSAIDs, /drugs/class/opioids
// shows opioids. The classification rules live in lib/classify.ts.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { type Drug, DRUGS } from '@/lib/drugs'
import { THERAPEUTIC_CLASSES, findClassBySlug, classifyDrug } from '@/lib/classify'

export async function generateStaticParams() {
  return THERAPEUTIC_CLASSES.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const klass = findClassBySlug(slug)
  if (!klass) return { title: 'Class not found' }
  return {
    title: klass.label,
    description: `${klass.subtitle} — Thai veterinary drug reference filtered by therapeutic class.`,
  }
}

export default async function ClassPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const klass = findClassBySlug(slug)
  if (!klass) notFound()

  const entries = DRUGS.filter(d => classifyDrug(d)?.slug === klass.slug)
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn))

  const canonical = entries.filter(e => e.reviewedBy !== null && e.signatures.length > 0).length
  const pending = entries.length - canonical

  // Adjacent classes for navigation
  const idx = THERAPEUTIC_CLASSES.findIndex(c => c.slug === klass.slug)
  const prev = idx > 0 ? THERAPEUTIC_CLASSES[idx - 1] : null
  const next = idx >= 0 && idx < THERAPEUTIC_CLASSES.length - 1 ? THERAPEUTIC_CLASSES[idx + 1] : null

  return (
    <article>
      <nav className="text-xs text-ink-700">
        <Link href="/drugs" className="hover:text-source-800">← Drug Reference</Link>
      </nav>

      <header className="mt-6 border-b border-paper-300 pb-7">
        <p className="eyebrow">Therapeutic class</p>
        <h1 className="display-h1 mt-3">{klass.label}</h1>
        <p className="mt-3 max-w-2xl text-[17px] italic leading-relaxed text-ink-700" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          {klass.subtitle}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] tabular text-ink-500">
          <span>{entries.length} entries</span>
          {canonical > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="text-emerald-800">{canonical} canonical</span>
            </>
          )}
          {pending > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="text-amber-800">{pending} pending</span>
            </>
          )}
        </div>
      </header>

      {/* Entries grid */}
      {entries.length === 0 ? (
        <p className="mt-12 rounded-md border border-paper-300 bg-paper-50 p-10 text-center text-ink-700">
          ยังไม่มี entry ในกลุ่มนี้
        </p>
      ) : (
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(d => <DrugCard key={d.slug} drug={d} />)}
        </ul>
      )}

      {/* All classes browse */}
      <section className="mt-16">
        <p className="eyebrow">Browse other classes</p>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {THERAPEUTIC_CLASSES.filter(c => c.slug !== klass.slug).map(c => (
            <li key={c.slug}>
              <Link
                href={`/drugs/class/${c.slug}`}
                className="inline-flex rounded-full border border-paper-300 bg-paper-50 px-3.5 py-1.5 text-[13px] text-ink-700 transition hover:border-source-500 hover:bg-paper-100 hover:text-source-800"
              >
                {c.label.split('·')[0].trim()}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Prev / Next sequential nav */}
      {(prev || next) && (
        <nav className="mt-12 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/drugs/class/${prev.slug}`}
              className="rounded-md border border-paper-300 bg-paper-50 px-5 py-4 text-sm transition hover:border-source-500 hover:bg-paper-100"
            >
              <p className="eyebrow">← Previous class</p>
              <p className="mt-2 font-medium text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                {prev.label.split('·')[0].trim()}
              </p>
            </Link>
          ) : <div />}
          {next ? (
            <Link
              href={`/drugs/class/${next.slug}`}
              className="rounded-md border border-paper-300 bg-paper-50 px-5 py-4 text-sm transition hover:border-source-500 hover:bg-paper-100 sm:text-right"
            >
              <p className="eyebrow">Next class →</p>
              <p className="mt-2 font-medium text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                {next.label.split('·')[0].trim()}
              </p>
            </Link>
          ) : <div />}
        </nav>
      )}
    </article>
  )
}

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
        </div>

        <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-500">
          <span>{drug.citations.length} citations</span>
          {drug.mirroredFrom && drug.mirroredFrom.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>{drug.mirroredFrom.length} sources</span>
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
