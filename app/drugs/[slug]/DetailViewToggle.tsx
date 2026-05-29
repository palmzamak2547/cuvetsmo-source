'use client'

// Essentials ⇆ Expert view toggle on drug detail pages.
//
// Default = ESSENTIALS — hides the cryptographic/ontology/mirror panels.
// Expert mode reveals them. Preference persists in localStorage.
//
// Approach: this toggle adds/removes a class on <article data-view-host>
// which CSS uses to show/hide elements with [data-expert-only].

import { useEffect, useState } from 'react'

const VIEW_KEY = 'cuvetsmo.detailView.v1'
type View = 'essentials' | 'expert'

export default function DetailViewToggle() {
  const [view, setView] = useState<View>('essentials')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(VIEW_KEY)
      if (saved === 'expert' || saved === 'essentials') setView(saved)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!mounted) return
    try { localStorage.setItem(VIEW_KEY, view) } catch { /* ignore */ }
    const hosts = document.querySelectorAll('[data-view-host]')
    hosts.forEach(h => {
      h.classList.toggle('view-essentials', view === 'essentials')
      h.classList.toggle('view-expert', view === 'expert')
    })
  }, [view, mounted])

  return (
    <div className="rounded-md border border-paper-300 bg-paper-50 p-3">
      <p className="eyebrow">View</p>
      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={() => setView('essentials')}
          className={`flex-1 rounded px-2.5 py-1.5 text-[12px] font-medium transition ${
            view === 'essentials'
              ? 'bg-source-800 text-paper-50'
              : 'bg-paper-50 text-ink-700 hover:bg-paper-100'
          }`}
        >
          Essentials
        </button>
        <button
          type="button"
          onClick={() => setView('expert')}
          className={`flex-1 rounded px-2.5 py-1.5 text-[12px] font-medium transition ${
            view === 'expert'
              ? 'bg-source-800 text-paper-50'
              : 'bg-paper-50 text-ink-700 hover:bg-paper-100'
          }`}
        >
          Expert
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-snug text-ink-500">
        {view === 'essentials'
          ? 'Dose-first. Crypto + ontology chrome hidden.'
          : 'All metadata: signatures, codes, mirror provenance, drafting.'}
      </p>
    </div>
  )
}
