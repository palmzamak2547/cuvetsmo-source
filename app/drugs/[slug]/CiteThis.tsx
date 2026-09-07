'use client'

// "Cite this entry" — one-click citation string for homework, case
// discussions, and papers. The string is built from server data only
// (no "retrieved today" date) so server + client render identically.

import { useState } from 'react'

export default function CiteThis({
  nameEn, nameTh, slug, version, lastUpdated,
}: {
  nameEn: string; nameTh: string; slug: string; version: number; lastUpdated: string
}) {
  const url = `https://source.cuvetsmo.com/drugs/${slug}`
  const year = lastUpdated.slice(0, 4)
  const text = `CUVETSMO Source. (${year}). ${nameEn} (${nameTh}), version ${version}, updated ${lastUpdated}. ${url}`
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      setState('failed')
    }
    setTimeout(() => setState('idle'), 2000)
  }

  return (
    <section className="rounded-md border border-paper-300 bg-paper-50 p-5">
      <p className="eyebrow">Cite this entry</p>
      <p className="mt-2 break-words text-[12px] leading-relaxed text-ink-700" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
        {text}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copy}
          className="rounded-sm border border-source-700 bg-source-800 px-3 py-1.5 text-xs font-medium text-paper-50 transition hover:bg-source-900"
        >
          Copy citation
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-sm border border-paper-300 bg-paper-50 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-source-500 hover:text-source-800"
          title="Print or save as PDF — the print layout drops navigation and keeps every citation"
        >
          Print / PDF
        </button>
        <span role="status" aria-live="polite" className="text-[11px] text-ink-500">
          {state === 'copied' ? 'Copied' : state === 'failed' ? 'Select the text to copy' : ''}
        </span>
      </div>
    </section>
  )
}
