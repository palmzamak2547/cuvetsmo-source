'use client'

// Global Cmd+K / Ctrl+K command palette.
//
// Press from any page → opens overlay with instant drug search.
// Type 1-2 letters → see filtered results.
// Arrow keys to navigate, Enter to jump.
// Esc to close.
//
// Mobile-friendly: tap the search icon in the header to open.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export type PaletteDrug = {
  slug: string
  nameEn: string
  nameTh: string
  class: string
  atcCode: string | null
  isCanonical: boolean
}

const STATIC_NAV: Array<{ slug: string; label: string; hint: string }> = [
  { slug: '/drugs',       label: 'Drug Reference',          hint: 'all entries by class' },
  { slug: '/search',      label: 'Search · filtered list',  hint: 'with status + class chips' },
  { slug: '/about',       label: 'About · how it works',    hint: '8 primitives explained' },
  { slug: '/use-cases',   label: 'Use cases',                hint: '8 personas, 3 tiers' },
  { slug: '/onboarding',  label: 'Faculty onboarding',       hint: '30-min walkthrough' },
  { slug: '/verify',      label: 'Verify in browser',        hint: 'Ed25519 + Web Crypto' },
  { slug: '/trust',       label: 'Chain of trust',           hint: 'DID → keys → entries' },
  { slug: '/log',         label: 'Transparency log',         hint: 'all signing events' },
  { slug: '/health',      label: 'Citation health',          hint: '132/132 healthy' },
  { slug: '/api',         label: 'Public API',               hint: 'JSON endpoints' },
  { slug: '/credentials', label: 'Credentials',              hint: 'W3C Verifiable Credentials' },
  { slug: '/assist',      label: 'Translation assistant',    hint: 'EN→TH editor' },
  { slug: '/feedback',    label: 'Feedback',                 hint: 'tell us what you need' },
  { slug: '/changelog',   label: 'Changelog',                hint: 'site milestones' },
  { slug: '/privacy',     label: 'Privacy stance',           hint: 'no analytics, no tracking' },
]

const RECENT_KEY = 'cuvetsmo.recent.v1'
const MAX_RECENT = 5

function readRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter(s => typeof s === 'string').slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

export function pushRecentDrug(slug: string) {
  if (typeof window === 'undefined') return
  try {
    const prev = readRecent().filter(s => s !== slug)
    const next = [slug, ...prev].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch { /* ignore */ }
}

export default function CommandPalette({ drugs }: { drugs: PaletteDrug[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [recent, setRecent] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Build index once
  const index = useMemo(() => drugs.map(d => ({
    drug: d,
    needle: [d.nameEn, d.nameTh, d.class, d.atcCode ?? '', d.slug].join(' ').toLowerCase(),
  })), [drugs])

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isModK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      const isSlash = e.key === '/' && !(['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName ?? ''))
      if (isModK || isSlash) {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Reset state on close, refocus on open, load recent
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      setRecent(readRecent())
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Close on route change (after navigation)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [open])

  // Compose result list
  const results = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (q.length === 0) {
      // No query → show recents + nav
      const recentDrugs = recent
        .map(slug => drugs.find(d => d.slug === slug))
        .filter((d): d is PaletteDrug => !!d)
      const drugSection = recentDrugs.length > 0
        ? recentDrugs.map(d => ({ kind: 'drug' as const, drug: d, group: 'Recent' }))
        : drugs.slice(0, 5).map(d => ({ kind: 'drug' as const, drug: d, group: 'Browse drugs' }))
      const navSection = STATIC_NAV.slice(0, 6).map(n => ({ kind: 'nav' as const, nav: n, group: 'Pages' }))
      return [...drugSection, ...navSection]
    }
    const tokens = q.split(/\s+/).filter(Boolean)
    const drugMatches = index
      .filter(i => tokens.every(t => i.needle.includes(t)))
      .slice(0, 8)
      .map(i => ({ kind: 'drug' as const, drug: i.drug, group: 'Drugs' }))
    const navMatches = STATIC_NAV
      .filter(n => n.label.toLowerCase().includes(q) || n.slug.toLowerCase().includes(q))
      .map(n => ({ kind: 'nav' as const, nav: n, group: 'Pages' }))
    return [...drugMatches, ...navMatches]
  }, [query, index, drugs, recent])

  // Clamp active index
  useEffect(() => {
    if (activeIdx >= results.length) setActiveIdx(Math.max(0, results.length - 1))
  }, [results.length, activeIdx])

  const navigate = useCallback((target: { kind: 'drug'; drug: PaletteDrug } | { kind: 'nav'; nav: { slug: string } }) => {
    if (target.kind === 'drug') {
      pushRecentDrug(target.drug.slug)
      router.push(`/drugs/${target.drug.slug}`)
    } else {
      router.push(target.nav.slug)
    }
    setOpen(false)
  }, [router])

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = results[activeIdx]
      if (target) navigate(target)
    }
  }

  if (!open) return null

  // Group results visually
  let lastGroup = ''

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Quick search">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Palette */}
      <div className="absolute left-1/2 top-[15%] w-full max-w-2xl -translate-x-1/2 px-4">
        <div
          className="overflow-hidden rounded-xl border border-paper-300 bg-paper-50 shadow-2xl ring-1 ring-source-900/10"
          onKeyDown={onListKey}
        >
          {/* Input */}
          <div className="flex items-center gap-3 border-b border-paper-200 px-5 py-4">
            <span aria-hidden className="text-source-700">⌕</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
              placeholder="พิมพ์ชื่อยา, ATC code, หรือหน้าเพจ — กด ↵ เพื่อเปิด"
              className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-ink-500"
              aria-label="Search drugs, ATC codes, and pages"
              style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden rounded border border-paper-300 bg-paper-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-500 sm:inline">
              esc
            </kbd>
          </div>

          {/* Results */}
          <ul className="max-h-[60vh] overflow-y-auto py-2">
            {results.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-ink-500">
                No matches for &ldquo;{query}&rdquo; — try a drug name, ATC code, or page
              </li>
            )}
            {results.map((r, i) => {
              const showGroup = r.group !== lastGroup
              lastGroup = r.group
              return (
                <div key={`${r.kind}-${i}`}>
                  {showGroup && (
                    <li className="mt-2 px-5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                      {r.group}
                    </li>
                  )}
                  <li>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => navigate(r)}
                      className={`flex w-full items-baseline gap-3 px-5 py-2 text-left transition ${
                        i === activeIdx ? 'bg-source-50 text-source-900' : 'text-ink-900 hover:bg-paper-100'
                      }`}
                    >
                      {r.kind === 'drug' ? (
                        <>
                          <span className="flex-1 min-w-0">
                            <span className="font-semibold tracking-tight" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                              {r.drug.nameEn}
                            </span>
                            <span className="ml-2 text-[12px] italic text-ink-500" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                              {r.drug.nameTh}
                            </span>
                            <span className="block text-[11px] text-ink-500 truncate">
                              {r.drug.class}
                            </span>
                          </span>
                          {r.drug.atcCode && (
                            <span className="shrink-0 rounded border border-source-300/60 bg-paper-100 px-1.5 py-0.5 font-mono text-[10px] text-source-800">
                              {r.drug.atcCode}
                            </span>
                          )}
                          {r.drug.isCanonical ? (
                            <span className="shrink-0 rounded-full bg-emerald-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-50" title="Expert-reviewed">✓</span>
                          ) : (
                            <span className="shrink-0 rounded-full border border-source-300 bg-source-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-source-800" title="Sourced &amp; cross-checked">◆</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="flex-1 min-w-0">
                            <span className="font-medium">{r.nav.label}</span>
                            <span className="block text-[11px] text-ink-500">{r.nav.hint}</span>
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-ink-500">{r.nav.slug}</span>
                        </>
                      )}
                    </button>
                  </li>
                </div>
              )
            })}
          </ul>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-paper-200 bg-paper-100/60 px-5 py-2.5 text-[11px] text-ink-500">
            <div className="flex gap-3">
              <span><kbd className="rounded border border-paper-300 bg-paper-50 px-1 py-0.5 font-mono text-[9px]">↑ ↓</kbd> navigate</span>
              <span><kbd className="rounded border border-paper-300 bg-paper-50 px-1 py-0.5 font-mono text-[9px]">↵</kbd> open</span>
              <span><kbd className="rounded border border-paper-300 bg-paper-50 px-1 py-0.5 font-mono text-[9px]">esc</kbd> close</span>
            </div>
            <span>{results.length > 0 ? `${results.length} result${results.length === 1 ? '' : 's'}` : ''}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
