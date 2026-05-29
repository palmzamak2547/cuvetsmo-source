// /search — client-side filter over the entry corpus.
//
// Server-renders the full entry list into the initial HTML so the page
// works offline after first visit (the service worker has cached the
// HTML). The search runs client-side against an index built once at
// mount.
//
// Phase 4 MVP: substring match + status filter + class filter. Phase 5
// stretch: transformers.js + bge-small embeddings for semantic search.

import { DRUGS } from '@/lib/drugs'
import { classifyDrug, THERAPEUTIC_CLASSES } from '@/lib/classify'
import SearchClient from './SearchClient'

export const metadata = {
  title: 'Search',
  description: 'Search canonical and pending entries — works offline after first visit.',
}

export default function SearchPage() {
  // Strip down to the fields we actually search/display so the JS
  // bundle stays lean. As the catalog grows we'll switch to a fetched
  // index endpoint instead of inlining.
  const slim = DRUGS.map(d => {
    const klass = classifyDrug(d)
    return {
      slug: d.slug,
      nameEn: d.nameEn,
      nameTh: d.nameTh,
      class: d.class,
      mechanism: d.mechanism ?? null,
      brandNamesTh: d.brandNamesTh ?? [],
      atcCode: d.codes?.atc?.code ?? null,
      atcName: d.codes?.atc?.name ?? null,
      rxnormCui: d.codes?.rxnorm?.cui ?? null,
      rxnormName: d.codes?.rxnorm?.name ?? null,
      indicationsText: d.indications.map(s => s.text).join(' '),
      contraindicationsText: d.contraindications.map(s => s.text).join(' '),
      isCanonical: d.reviewedBy !== null && d.signatures.length > 0,
      signatures: d.signatures.length,
      classSlug: klass?.slug ?? 'other',
      classLabel: klass?.label.split('·')[0].trim() ?? 'Other',
    }
  })

  // Build class filter options — only classes with at least 1 entry.
  const classFilters = THERAPEUTIC_CLASSES
    .map(c => ({
      slug: c.slug,
      label: c.label.split('·')[0].trim(),
      count: slim.filter(e => e.classSlug === c.slug).length,
    }))
    .filter(c => c.count > 0)

  return (
    <article className="max-w-3xl">
      <header className="border-b border-paper-300 pb-7">
        <p className="eyebrow">Search</p>
        <h1 className="display-h1 mt-3">ค้นหา entries</h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          พิมพ์ชื่อยา (ไทย/อังกฤษ), ชื่อทางการค้า, ATC code, RxNorm CUI, indication, หรือคลาส —
          ค้นจากทั้ง canonical และ pending entries. ใช้งานได้แบบ offline หลังเปิดครั้งแรก.
        </p>
      </header>

      <SearchClient entries={slim} classFilters={classFilters} />
    </article>
  )
}
