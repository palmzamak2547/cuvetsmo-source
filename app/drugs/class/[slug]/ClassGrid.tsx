'use client'

// Class page grid with a species filter — "which NSAIDs have a feline
// dose?" is the question a clinician brings to a class page. Cards take
// plain serialisable props so this can be a client component; the server
// page derives them from the drug files.

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { SPECIES_TH } from '@/lib/species'

export type ClassCard = {
  slug: string
  nameEn: string
  nameTh: string
  atc: string | null
  species: string[]
  citations: number
  sources: number
  tier: 'sourced' | 'community' | 'expert'
}

export default function ClassGrid({ entries }: { entries: ClassCard[] }) {
  const species = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of entries) for (const s of e.species) counts.set(s, (counts.get(s) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [entries])
  const [active, setActive] = useState<string | null>(null)
  const shown = active ? entries.filter(e => e.species.includes(active)) : entries

  return (
    <div>
      {species.length > 1 && (
        <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filter entries by species with dosing">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">Has dosing for</span>
          <Chip active={active === null} onClick={() => setActive(null)}>
            All <Count n={entries.length} />
          </Chip>
          {species.map(([s, n]) => (
            <Chip key={s} active={active === s} onClick={() => setActive(active === s ? null : s)}>
              <span className="capitalize">{s}</span>
              <span className="ml-1 opacity-70">{SPECIES_TH[s] ?? ''}</span>
              <Count n={n} />
            </Chip>
          ))}
        </div>
      )}
      <p className="sr-only" role="status" aria-live="polite">{shown.length} of {entries.length} entries shown</p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map(d => <Card key={d.slug} d={d} />)}
      </ul>
    </div>
  )
}

function Card({ d }: { d: ClassCard }) {
  const border =
    d.tier === 'expert' ? 'border-emerald-400/70 hover:border-emerald-500 hover:bg-emerald-50/40'
    : d.tier === 'community' ? 'border-sky-400/70 hover:border-sky-500 hover:bg-sky-50/40'
    : 'border-paper-300 hover:border-source-500 hover:bg-paper-100/60'
  return (
    <li>
      <Link
        href={`/drugs/${d.slug}`}
        className={`flex h-full flex-col rounded-md border bg-paper-50 p-5 transition hover:-translate-y-0.5 hover:shadow-sm ${border}`}
      >
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[17px] font-semibold tracking-tight text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            {d.nameEn}
          </h3>
          {d.tier === 'expert' ? (
            <span className="shrink-0 rounded-full bg-emerald-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-50" title="Expert-reviewed">✓</span>
          ) : d.tier === 'community' ? (
            <span className="shrink-0 rounded-full bg-sky-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-50" title="Community-checked">✓✓</span>
          ) : (
            <span className="shrink-0 rounded-full border border-source-300 bg-source-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-source-800" title="Verified">◆</span>
          )}
        </div>
        <p className="text-[13px] italic text-ink-700" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{d.nameTh}</p>

        {d.atc && (
          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] tabular text-ink-500">
            <span className="rounded border border-source-300/60 bg-paper-100 px-1.5 py-0.5 font-mono text-source-800">{d.atc}</span>
          </div>
        )}
        {d.species.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase tracking-wider text-ink-500" aria-label="Species with dosing">
            {d.species.map(s => <span key={s} className="rounded-sm bg-paper-200/80 px-1.5 py-0.5">{s}</span>)}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-4 text-[11px] text-ink-500">
          <span>{d.citations} citation{d.citations === 1 ? '' : 's'}</span>
          {d.sources > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>{d.sources} source{d.sources === 1 ? '' : 's'}</span>
            </>
          )}
        </div>
      </Link>
    </li>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] transition ${
        active
          ? 'border-source-700 bg-source-800 text-paper-50'
          : 'border-paper-300 bg-paper-50 text-ink-700 hover:border-source-500 hover:text-source-800'
      }`}
    >
      {children}
    </button>
  )
}

function Count({ n }: { n: number }) {
  return <span className="ml-1.5 rounded-full bg-paper-200/70 px-1.5 py-px text-[10px] font-semibold tabular text-ink-700">{n}</span>
}
