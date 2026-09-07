'use client'

// Instant filter for the 420-card catalog. Deliberately direct-DOM: the
// cards are server-rendered once; this component only toggles `hidden` on
// <li data-needle> and on each class section that ends up empty. Hydrating
// 420 cards as React state would cost more than the feature is worth.

import { useEffect, useRef, useState } from 'react'

export default function CatalogFilter({ total }: { total: number }) {
  const [q, setQ] = useState('')
  const [shown, setShown] = useState(total)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const needle = q.trim().toLowerCase()
    const tokens = needle ? needle.split(/\s+/) : []
    let visible = 0
    const sections = document.querySelectorAll<HTMLElement>('[data-class-section]')
    sections.forEach(section => {
      let inSection = 0
      section.querySelectorAll<HTMLElement>('li[data-needle]').forEach(li => {
        const hay = li.dataset.needle ?? ''
        const hit = tokens.every(t => hay.includes(t))
        li.hidden = !hit
        if (hit) { inSection++; visible++ }
      })
      section.hidden = inSection === 0
    })
    setShown(visible)
  }, [q])

  return (
    <div className="mt-8">
      <label htmlFor="catalog-filter" className="sr-only">Filter drugs on this page</label>
      <div className="relative">
        <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-source-700">⌕</span>
        <input
          ref={inputRef}
          id="catalog-filter"
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') setQ('') }}
          placeholder="Filter this page — ชื่อยา, ชื่อไทย, ATC code"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-md border-2 border-paper-300 bg-paper-50 py-3 pl-10 pr-24 text-[15px] text-ink-900 transition placeholder:text-ink-500 focus:border-source-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-source-600"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] tabular text-ink-500" role="status" aria-live="polite">
          {q.trim() ? `${shown} of ${total}` : `${total} entries`}
        </span>
      </div>
    </div>
  )
}
