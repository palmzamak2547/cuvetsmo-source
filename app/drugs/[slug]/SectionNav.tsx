'use client'

// "On this page" chips with scroll-spy: the chip for the section under the
// sticky bar is highlighted (aria-current). IntersectionObserver only —
// no scroll listeners, no layout reads per frame.

import { useEffect, useState } from 'react'

export type SectionLink = { id: string; label: string }

export default function SectionNav({ links }: { links: SectionLink[] }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const els = links.map(l => document.getElementById(l.id)).filter((e): e is HTMLElement => !!e)
    if (els.length === 0) return
    const io = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      // Top edge below the sticky bar; bottom edge at 40% of the viewport so
      // the section whose heading is in the upper part of the screen wins.
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [links])

  return (
    <nav
      aria-label="On this page"
      className="no-print mt-6 flex flex-wrap items-center gap-2 font-sans text-[12px] md:sticky md:top-16 md:z-20 md:-mx-2 md:border-b md:border-paper-200 md:bg-paper-50/90 md:px-2 md:py-2 md:backdrop-blur-sm"
    >
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">On this page</span>
      {links.map(l => {
        const on = active === l.id
        return (
          <a
            key={l.id}
            href={`#${l.id}`}
            aria-current={on ? 'location' : undefined}
            className={`rounded-full border px-3 py-1 transition ${
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
