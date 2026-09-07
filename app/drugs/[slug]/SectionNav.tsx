'use client'

// "On this page" chips with scroll-spy. Sticky under the site header on
// every viewport: a single horizontally-scrolling row on phones (the
// header is one row there), wrapping chips on md+. The active chip is
// highlighted via IntersectionObserver and kept in view on phones.

import { useEffect, useRef, useState } from 'react'

export type SectionLink = { id: string; label: string }

export default function SectionNav({ links }: { links: SectionLink[] }) {
  const [active, setActive] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)
  // Every section currently inside the band, across callbacks — a callback
  // only reports the entries that CHANGED, so deciding from those alone
  // let a lower section steal the highlight from a higher one still in view.
  const inBand = useRef(new Set<string>())

  useEffect(() => {
    const els = links.map(l => document.getElementById(l.id)).filter((e): e is HTMLElement => !!e)
    if (els.length === 0) return
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.current.add(e.target.id)
          else inBand.current.delete(e.target.id)
        }
        const first = links.find(l => inBand.current.has(l.id))
        if (first) setActive(first.id)
      },
      // Top edge below the sticky bar; bottom edge at 40% of the viewport so
      // the section whose heading is in the upper part of the screen wins.
      { rootMargin: '-110px 0px -60% 0px', threshold: 0 },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [links])

  // Keep the active chip visible in the scrolling row (phones).
  useEffect(() => {
    if (!active) return
    const chip = navRef.current?.querySelector<HTMLElement>(`a[href="#${active}"]`)
    chip?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'auto' })
  }, [active])

  return (
    <nav
      ref={navRef}
      aria-label="On this page"
      className="no-print sticky top-[61px] z-20 -mx-5 mt-6 flex items-center gap-2 overflow-x-auto border-b border-paper-200 bg-paper-50/90 px-5 py-2 font-sans text-[12px] backdrop-blur-sm [scrollbar-width:none] sm:top-[66px] md:-mx-2 md:flex-wrap md:px-2"
    >
      <span className="mr-1 hidden shrink-0 text-[10px] font-semibold uppercase tracking-wider text-ink-500 md:inline">On this page</span>
      {links.map(l => {
        const on = active === l.id
        return (
          <a
            key={l.id}
            href={`#${l.id}`}
            aria-current={on ? 'location' : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 transition ${
              on
                ? 'border-source-700 bg-source-800 text-paper-50'
                : 'border-paper-300 bg-paper-50 text-ink-700 hover:border-source-500 hover:text-source-800'
            }`}
          >
            {l.label}
          </a>
        )
      })}
    </nav>
  )
}
