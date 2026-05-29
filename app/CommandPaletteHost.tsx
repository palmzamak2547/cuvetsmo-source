'use client'

// Client-side host that mounts the command palette + a header search
// button that opens it. Listens for the global Cmd+K shortcut.

import { useEffect, useState } from 'react'
import CommandPalette, { type PaletteDrug } from './CommandPalette'

export default function CommandPaletteHost({ drugs }: { drugs: PaletteDrug[] }) {
  // The palette manages its own open state via window keydown — we
  // just mount it. The header button uses a custom event to trigger.
  return <CommandPalette drugs={drugs} />
}

// Tiny button that triggers the palette via synthetic Ctrl+K — used in
// the header to make the keyboard shortcut discoverable on mobile.
export function CommandPaletteTrigger() {
  const [isMac, setIsMac] = useState(false)
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPhone|iPad/.test(navigator.platform))
    }
  }, [])
  const openPalette = () => {
    // Synthesize a Ctrl+K keydown so the palette opens.
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k', ctrlKey: !isMac, metaKey: isMac, bubbles: true,
    }))
  }
  return (
    <button
      type="button"
      onClick={openPalette}
      aria-label="Open quick search (Cmd+K)"
      className="inline-flex items-center gap-2 rounded-md border border-paper-300 bg-paper-50 px-2.5 py-1.5 text-[12px] text-ink-700 transition hover:border-source-500 hover:text-source-800"
    >
      <span aria-hidden>⌕</span>
      <span className="hidden sm:inline">Search drugs…</span>
      <kbd className="hidden rounded border border-paper-300 bg-paper-100 px-1 py-px font-mono text-[9px] text-ink-500 md:inline">
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </button>
  )
}
