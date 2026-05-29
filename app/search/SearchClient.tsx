'use client'

// Client component for /search.
//
// Perf checklist applied (per input-lag-perf-checklist memory rule):
//   - useMemo for the pre-built lowercase index (one-time cost)
//   - useDeferredValue for the query (avoids blocking keystrokes on
//     re-renders when the result list is large)
//   - No per-keystroke toLowerCase on the corpus (only on the query)
//   - No JSON.stringify in the filter loop
//   - Filter chips compose with text query without rebuilding the index

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

export type SearchEntry = {
  slug: string
  nameEn: string
  nameTh: string
  class: string
  mechanism: string | null
  brandNamesTh: string[]
  atcCode: string | null
  atcName: string | null
  rxnormCui: string | null
  rxnormName: string | null
  indicationsText: string
  contraindicationsText: string
  isCanonical: boolean
  signatures: number
  classSlug: string
  classLabel: string
}

export type ClassFilter = {
  slug: string
  label: string
  count: number
}

type StatusFilter = 'all' | 'canonical' | 'pending'

type Indexed = {
  entry: SearchEntry
  needle: string
}

function buildIndex(entries: SearchEntry[]): Indexed[] {
  return entries.map(e => ({
    entry: e,
    needle: [
      e.nameEn,
      e.nameTh,
      e.class,
      e.mechanism ?? '',
      ...e.brandNamesTh,
      e.atcCode ?? '',
      e.atcName ?? '',
      e.rxnormCui ?? '',
      e.rxnormName ?? '',
      e.indicationsText,
      e.contraindicationsText,
      e.slug,
    ].join(' ').toLowerCase(),
  }))
}

export default function SearchClient({
  entries,
  classFilters,
}: {
  entries: SearchEntry[]
  classFilters: ClassFilter[]
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [classSlug, setClassSlug] = useState<string | null>(null)
  const deferred = useDeferredValue(query)
  const inputRef = useRef<HTMLInputElement>(null)

  // Build the index once.
  const index = useMemo(() => buildIndex(entries), [entries])

  const matches = useMemo(() => {
    const q = deferred.trim().toLowerCase()
    const tokens = q.length > 0 ? q.split(/\s+/).filter(Boolean) : []
    return index.filter(i => {
      // Status filter
      if (status === 'canonical' && !i.entry.isCanonical) return false
      if (status === 'pending' && i.entry.isCanonical) return false
      // Class filter
      if (classSlug && i.entry.classSlug !== classSlug) return false
      // Text filter
      if (tokens.length === 0) return true
      return tokens.every(t => i.needle.includes(t))
    })
  }, [deferred, index, status, classSlug])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const totalActiveFilters = (query.trim() ? 1 : 0) + (status !== 'all' ? 1 : 0) + (classSlug ? 1 : 0)

  return (
    <div>
      {/* Search input */}
      <div className="mt-7">
        <label htmlFor="q" className="sr-only">Search</label>
        <input
          ref={inputRef}
          id="q"
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="meloxicam, NSAID, M01AC06, post-op pain…"
          className="w-full rounded-md border-2 border-paper-300 bg-paper-50 px-4 py-3.5 text-[15px] text-ink-900 transition focus:border-source-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-source-600"
        />
      </div>

      {/* Status chips */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="mr-2 text-[10px] uppercase tracking-wider text-ink-500">Status</span>
        <FilterChip
          active={status === 'all'}
          onClick={() => setStatus('all')}
        >
          All
        </FilterChip>
        <FilterChip
          active={status === 'canonical'}
          onClick={() => setStatus('canonical')}
          tone="emerald"
        >
          ✓ Canonical
        </FilterChip>
        <FilterChip
          active={status === 'pending'}
          onClick={() => setStatus('pending')}
          tone="amber"
        >
          ⏳ Pending
        </FilterChip>
      </div>

      {/* Class chips */}
      {classFilters.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-[10px] uppercase tracking-wider text-ink-500">Class</span>
          <FilterChip
            active={classSlug === null}
            onClick={() => setClassSlug(null)}
          >
            Any
          </FilterChip>
          {classFilters.map(c => (
            <FilterChip
              key={c.slug}
              active={classSlug === c.slug}
              onClick={() => setClassSlug(c.slug)}
            >
              {c.label} <span className="ml-1 text-[10px] tabular opacity-65">{c.count}</span>
            </FilterChip>
          ))}
        </div>
      )}

      {/* Result counter + reset */}
      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-paper-200 pb-2">
        <p className="text-[12px] tabular text-ink-700">
          {matches.length === index.length
            ? `${index.length} entries`
            : `${matches.length} of ${index.length} entries`}
        </p>
        {totalActiveFilters > 0 && (
          <button
            onClick={() => {
              setQuery('')
              setStatus('all')
              setClassSlug(null)
            }}
            className="text-[11px] uppercase tracking-wider text-source-800 hover:underline"
          >
            Reset filters →
          </button>
        )}
      </div>

      {/* Results */}
      {matches.length === 0 ? (
        <div className="mt-6 rounded-md border border-paper-300 bg-paper-100/60 p-8 text-center text-sm text-ink-700">
          ไม่พบ entry ที่ match — ลองเปลี่ยน keyword หรือลบ filter
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {matches.map(m => (
            <SearchResult key={m.entry.slug} entry={m.entry} query={deferred.toLowerCase().trim()} />
          ))}
        </ul>
      )}

      {/* Offline hint */}
      <p className="mt-10 rounded-md border border-paper-200 bg-paper-100 p-3 text-[11px] text-ink-500">
        Tip: หลังเปิดหน้านี้ครั้งแรก service worker จะ cache ไว้ — เปิดอีกครั้งโดยไม่มีเน็ตก็ยังค้นได้
      </p>
    </div>
  )
}

function FilterChip({
  children,
  active,
  onClick,
  tone = 'source',
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  tone?: 'source' | 'emerald' | 'amber'
}) {
  const activeStyles = {
    source:  'border-source-700 bg-source-800 text-paper-50',
    emerald: 'border-emerald-700 bg-emerald-700 text-emerald-50',
    amber:   'border-amber-700 bg-amber-600 text-amber-50',
  } as const
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] transition ${
        active
          ? activeStyles[tone]
          : 'border-paper-300 bg-paper-50 text-ink-700 hover:border-source-500 hover:text-source-800'
      }`}
    >
      {children}
    </button>
  )
}

function SearchResult({ entry, query }: { entry: SearchEntry; query: string }) {
  return (
    <li>
      <Link
        href={`/drugs/${entry.slug}`}
        className={`block rounded-md border bg-paper-50 p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${
          entry.isCanonical ? 'border-emerald-400/70 hover:border-emerald-500' : 'border-paper-300 hover:border-source-500'
        }`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[17px] font-semibold text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            <Highlight text={entry.nameEn} query={query} />
            <span className="ml-2 text-[13px] font-normal italic text-ink-700">
              <Highlight text={entry.nameTh} query={query} />
            </span>
          </h3>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            entry.isCanonical
              ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
              : 'border-amber-400 bg-amber-50 text-amber-900'
          }`}>
            {entry.isCanonical ? `✓ ${entry.signatures} sig` : '⏳ pending'}
          </span>
        </div>
        <p className="mt-1 text-[12px] text-ink-700">
          <Highlight text={entry.class} query={query} />
        </p>
        {(entry.atcCode || entry.rxnormCui) && (
          <p className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-paper-700 tabular">
            {entry.atcCode && (
              <span className="rounded border border-source-300/60 bg-paper-100 px-1.5 py-0.5 font-mono text-source-800">
                {entry.atcCode}
              </span>
            )}
            {entry.rxnormCui && (
              <span className="rounded border border-source-300/60 bg-paper-100 px-1.5 py-0.5 font-mono text-source-800">
                RxNorm {entry.rxnormCui}
              </span>
            )}
            <span className="ml-auto text-[10px] uppercase tracking-wider text-ink-500">
              {entry.classLabel}
            </span>
          </p>
        )}
      </Link>
    </li>
  )
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query || query.length === 0) return <>{text}</>
  const tokens = query.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return <>{text}</>
  const lower = text.toLowerCase()
  for (const t of tokens) {
    const i = lower.indexOf(t)
    if (i >= 0) {
      return (
        <>
          {text.slice(0, i)}
          <mark className="rounded bg-amber-200 px-0.5">{text.slice(i, i + t.length)}</mark>
          {text.slice(i + t.length)}
        </>
      )
    }
  }
  return <>{text}</>
}
