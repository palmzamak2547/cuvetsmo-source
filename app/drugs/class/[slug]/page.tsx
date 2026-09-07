// /drugs/class/[slug] — therapeutic-class filtered view.
//
// e.g. /drugs/class/nsaids shows only NSAIDs, /drugs/class/opioids
// shows opioids. The classification rules live in lib/classify.ts.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DRUGS, verificationTier } from '@/lib/drugs'
import { THERAPEUTIC_CLASSES, findClassBySlug, classifyDrug } from '@/lib/classify'
import { jsonLd } from '@/lib/jsonld'
import ClassGrid from './ClassGrid'

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

  const community = entries.filter(e => verificationTier(e) === 'community').length
  const expert = entries.filter(e => verificationTier(e) === 'expert').length

  // Adjacent classes for navigation
  const idx = THERAPEUTIC_CLASSES.findIndex(c => c.slug === klass.slug)
  const prev = idx > 0 ? THERAPEUTIC_CLASSES[idx - 1] : null
  const next = idx >= 0 && idx < THERAPEUTIC_CLASSES.length - 1 ? THERAPEUTIC_CLASSES[idx + 1] : null

  const listJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: klass.label,
    description: klass.subtitle,
    url: `https://source.cuvetsmo.com/drugs/class/${klass.slug}`,
    numberOfItems: entries.length,
    itemListElement: entries.map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: d.nameEn,
      url: `https://source.cuvetsmo.com/drugs/${d.slug}`,
    })),
  }

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listJsonLd) }} />
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
          <span aria-hidden>·</span>
          <span className="text-source-800">◆ {entries.length} verified</span>
          {community > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="text-sky-800">✓✓ {community} community-checked</span>
            </>
          )}
          {expert > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="text-emerald-800">✓ {expert} expert-reviewed</span>
            </>
          )}
        </div>
      </header>

      {/* Entries grid — client component so the species filter can narrow it */}
      {entries.length === 0 ? (
        <p className="mt-12 rounded-md border border-paper-300 bg-paper-50 p-10 text-center text-ink-700">
          ยังไม่มี entry ในกลุ่มนี้
        </p>
      ) : (
        <ClassGrid
          entries={entries.map(d => ({
            slug: d.slug,
            nameEn: d.nameEn,
            nameTh: d.nameTh,
            atc: d.codes?.atc?.code ?? null,
            species: [...new Set(d.dosages.map(x => x.species))],
            citations: d.citations.length,
            sources: d.mirroredFrom?.length ?? 0,
            tier: verificationTier(d),
          }))}
        />
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
