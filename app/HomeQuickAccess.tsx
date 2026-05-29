'use client'

// Homepage quick-access bar — big search trigger + class chips + recently-viewed.
// Sits below the hero headline as the first action surface for new + returning visitors.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CommandPaletteTrigger } from './CommandPaletteHost'

type QuickClass = { slug: string; label: string; count: number }

export type RecentDrug = {
  slug: string
  nameEn: string
  nameTh: string
  class: string
  isCanonical: boolean
}

const RECENT_KEY = 'cuvetsmo.recent.v1'

export default function HomeQuickAccess({
  topClasses,
  drugIndex,
}: {
  topClasses: QuickClass[]
  drugIndex: RecentDrug[]
}) {
  const [recent, setRecent] = useState<RecentDrug[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      if (!raw) return
      const slugs = JSON.parse(raw)
      if (!Array.isArray(slugs)) return
      const drugs = slugs
        .filter(s => typeof s === 'string')
        .map(s => drugIndex.find(d => d.slug === s))
        .filter((d): d is RecentDrug => !!d)
      setRecent(drugs)
    } catch { /* ignore */ }
  }, [drugIndex])

  return (
    <section className="mt-10 rounded-lg border border-source-300/70 bg-paper-100/70 p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="eyebrow">Quick access</p>
        <p className="text-[11px] text-ink-500 hidden sm:block">
          Press <kbd className="rounded border border-paper-300 bg-paper-50 px-1 py-px font-mono text-[10px]">⌘K</kbd> หรือ <kbd className="rounded border border-paper-300 bg-paper-50 px-1 py-px font-mono text-[10px]">/</kbd> ทุกที่ในเว็บ
        </p>
      </div>

      {/* Big search trigger */}
      <div className="mt-3">
        <BigSearchTrigger />
      </div>

      {/* Class chips */}
      <div className="mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-2">
          Browse by class
        </p>
        <ul className="flex flex-wrap gap-2">
          {topClasses.map(c => (
            <li key={c.slug}>
              <Link
                href={`/drugs/class/${c.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-paper-300 bg-paper-50 px-3 py-1.5 text-[13px] text-ink-700 transition hover:border-source-500 hover:bg-paper-100 hover:text-source-800"
              >
                <span>{c.label}</span>
                <span className="rounded-full bg-paper-200 px-1.5 py-px text-[10px] font-semibold tabular text-ink-700">
                  {c.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Recently viewed (if any) */}
      {recent.length > 0 && (
        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-2">
            Recently viewed
          </p>
          <ul className="flex flex-wrap gap-2">
            {recent.map(d => (
              <li key={d.slug}>
                <Link
                  href={`/drugs/${d.slug}`}
                  className={`inline-flex items-baseline gap-1.5 rounded-full border bg-paper-50 px-3 py-1.5 text-[13px] transition hover:-translate-y-0.5 hover:shadow-sm ${
                    d.isCanonical
                      ? 'border-emerald-400/70 text-emerald-900 hover:border-emerald-500'
                      : 'border-paper-300 text-ink-700 hover:border-source-500 hover:text-source-800'
                  }`}
                >
                  <span className="font-medium" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{d.nameEn}</span>
                  <span className="text-[11px] italic text-ink-500" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{d.nameTh}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function BigSearchTrigger() {
  const [isMac, setIsMac] = useState(false)
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPhone|iPad/.test(navigator.platform))
    }
  }, [])
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'k', ctrlKey: !isMac, metaKey: isMac, bubbles: true,
      }))}
      className="group flex w-full items-center gap-3 rounded-lg border-2 border-source-300 bg-paper-50 px-4 py-3.5 text-left text-[15px] text-ink-500 transition hover:border-source-600 hover:bg-paper-100"
    >
      <span aria-hidden className="text-source-700 text-lg">⌕</span>
      <span className="flex-1">
        <span className="text-source-900 font-medium">Search</span>
        <span className="ml-2 hidden sm:inline text-ink-500">
          meloxicam, NSAID, M01AC06, post-op pain, ATC code, indication
        </span>
        <span className="ml-2 sm:hidden text-ink-500">drug, class, code…</span>
      </span>
      <kbd className="hidden rounded border border-paper-300 bg-paper-100 px-2 py-1 font-mono text-[11px] text-ink-700 sm:inline">
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </button>
  )
}
