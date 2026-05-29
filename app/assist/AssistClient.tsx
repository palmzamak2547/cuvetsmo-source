'use client'

// Faculty translation editor — manual side-by-side EN↔TH editor.
// Phase 5+ will add opt-in WebGPU LLM (Phi-3 / Llama 3.2) loaded
// dynamically into the user's browser. For now: manual editor +
// detection + export-to-JSON.

import { useEffect, useMemo, useState } from 'react'

type Section = 'mechanism' | 'indications' | 'contraindications' | 'sideEffects' | 'dosages'

const SECTION_LABEL: Record<Section, string> = {
  mechanism:         'Mechanism · กลไกการออกฤทธิ์',
  indications:       'Indications · ข้อบ่งใช้',
  contraindications: 'Contraindications · ข้อห้ามใช้',
  sideEffects:       'Side effects · ผลข้างเคียง',
  dosages:           'Dosages · ขนาดยา',
}

const SECTIONS: Section[] = ['mechanism', 'indications', 'contraindications', 'sideEffects', 'dosages']

type WebGPUStatus = 'unknown' | 'supported' | 'unsupported' | 'checking'

export default function AssistClient() {
  const [section, setSection] = useState<Section>('mechanism')
  const [drugSlug, setDrugSlug] = useState('')
  const [source, setSource] = useState('')
  const [translation, setTranslation] = useState('')
  const [webGPU, setWebGPU] = useState<WebGPUStatus>('checking')

  useEffect(() => {
    // Detect WebGPU support — required for in-browser LLM (Phase 5).
    if (typeof window === 'undefined') return
    const nav = navigator as Navigator & { gpu?: unknown }
    if (typeof nav.gpu !== 'undefined') {
      setWebGPU('supported')
    } else {
      setWebGPU('unsupported')
    }
  }, [])

  const stats = useMemo(() => {
    const srcWords = source.trim().split(/\s+/).filter(Boolean).length
    // Thai word count is tricky — split on whitespace + Thai punctuation
    const trWords = translation.trim().split(/[\s,.!?]+/).filter(Boolean).length
    const srcChars = source.length
    const trChars = translation.length
    return { srcWords, trWords, srcChars, trChars }
  }, [source, translation])

  const exportJSON = () => {
    const payload = {
      drugSlug: drugSlug || '<paste-slug-here>',
      section,
      text: translation,
      cites: ['dailymed-<slug>', 'wsava-pain-2022'],  // hint — faculty edits
      generatedAt: new Date().toISOString(),
      generatedBy: 'cuvetsmo-source /assist editor — manual translation',
    }
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${drugSlug || 'draft'}-${section}-draft.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyJSON = async () => {
    const payload = {
      [section]: section === 'dosages'
        ? [{ species: 'canine', indication: '<faculty fills>', route: 'PO', dose: translation, cites: [`dailymed-${drugSlug || '<slug>'}`] }]
        : [{ text: translation, cites: [`dailymed-${drugSlug || '<slug>'}`] }],
    }
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
  }

  const reset = () => {
    setSource('')
    setTranslation('')
  }

  return (
    <div className="mt-8">
      {/* AI assistant status */}
      <div className={`rounded-md border-l-4 px-5 py-4 text-sm ${
        webGPU === 'supported' ? 'border-source-400 bg-source-50/40 text-ink-900'
        : webGPU === 'unsupported' ? 'border-amber-400 bg-amber-50/40 text-amber-900'
        : 'border-paper-300 bg-paper-100 text-ink-700'
      }`}>
        <p className="font-semibold tracking-tight">
          {webGPU === 'supported' && '✓ WebGPU detected'}
          {webGPU === 'unsupported' && '⚠ WebGPU not available in this browser'}
          {webGPU === 'checking' && 'Detecting browser capabilities…'}
        </p>
        <p className="mt-1.5 text-[13px]">
          {webGPU === 'supported' && (
            <>
              Your browser can run AI translation suggestions in-browser (Phase 5+). The opt-in installer (Phi-3 mini ~2.4 GB or Llama 3.2 1B ~1.2 GB) is coming.
              Today: use the manual editor below.
            </>
          )}
          {webGPU === 'unsupported' && (
            <>
              In-browser LLM requires WebGPU (Chrome/Edge ≥ 113, Firefox ≥ 122, Safari ≥ 17). You can still use the manual translation editor below.
            </>
          )}
          {webGPU === 'checking' && <>Reading navigator.gpu…</>}
        </p>
      </div>

      {/* Drug slug + section selector */}
      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_2fr]">
        <div>
          <label htmlFor="drugSlug" className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Drug slug</label>
          <input
            id="drugSlug"
            value={drugSlug}
            onChange={e => setDrugSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="e.g. meloxicam, carprofen"
            className="mt-1 w-full rounded-md border-2 border-paper-300 bg-paper-50 px-3 py-2 text-sm font-mono text-ink-900 transition focus:border-source-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-source-600"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Section</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {SECTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSection(s)}
                className={`inline-flex rounded-full border px-3 py-1 text-[12px] transition ${
                  section === s
                    ? 'border-source-700 bg-source-800 text-paper-50'
                    : 'border-paper-300 bg-paper-50 text-ink-700 hover:border-source-500 hover:text-source-800'
                }`}
              >
                {SECTION_LABEL[s].split('·')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column editor */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel
          title="Source · English"
          subtitle="Paste from DailyMed, WHO EML, WSAVA guideline, or original paper"
          value={source}
          onChange={setSource}
          placeholder={`e.g.\n\nMeloxicam is a non-steroidal anti-inflammatory drug (NSAID) with anti-inflammatory, analgesic, and antipyretic properties. It is a preferential inhibitor of cyclooxygenase-2 (COX-2)...`}
          stats={`${stats.srcWords} words · ${stats.srcChars} chars`}
          dir="ltr"
        />
        <Panel
          title="Translation · ภาษาไทย"
          subtitle={SECTION_LABEL[section]}
          value={translation}
          onChange={setTranslation}
          placeholder={`พิมพ์คำแปลภาษาไทยที่นี่...\n\nเช่น: เมล็อกซิแคม เป็นยาแก้อักเสบกลุ่ม non-steroidal anti-inflammatory drug (NSAID) ที่มีฤทธิ์ลดการอักเสบ, แก้ปวด, และลดไข้ โดยยับยั้ง COX-2 เฉพาะมากกว่า COX-1...`}
          stats={`${stats.trWords} terms · ${stats.trChars} chars`}
          dir="ltr"
        />
      </div>

      {/* Action bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={exportJSON}
          disabled={!translation}
          className="inline-flex rounded-md bg-source-800 px-4 py-2.5 text-sm font-medium text-paper-50 transition hover:bg-source-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export draft as JSON ↓
        </button>
        <button
          type="button"
          onClick={copyJSON}
          disabled={!translation}
          className="inline-flex rounded-md border border-paper-300 bg-paper-50 px-4 py-2.5 text-sm font-medium text-ink-900 transition hover:border-source-600 hover:text-source-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Copy section JSON to clipboard
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex rounded-md border border-paper-300 bg-paper-50 px-4 py-2.5 text-sm text-ink-700 transition hover:border-red-400 hover:text-red-700"
        >
          Reset
        </button>
        <span
          className="ml-auto cursor-not-allowed rounded-md border border-paper-300 bg-paper-100 px-4 py-2.5 text-[12px] text-ink-500"
          title="WebGPU LLM is on the Phase 5 roadmap"
        >
          🤖 Install AI assistant (Phase 5+ · coming)
        </span>
      </div>

      {/* Workflow hint */}
      <div className="mt-8 rounded-md border border-paper-300 bg-paper-50 p-5 text-[13px] text-ink-700">
        <p className="eyebrow">Workflow</p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5">
          <li>Paste authoritative English text on the left (cite source in PR description)</li>
          <li>Type Thai translation on the right, section by section</li>
          <li>Click <b>Copy section JSON</b> → paste into <code>content/drugs/&lt;slug&gt;.json</code> at the matching section</li>
          <li>Set <code>drafting.aiAssisted: false</code> + <code>drafting.humanReviewer: &quot;your-github-handle&quot;</code></li>
          <li>Run <code>npm run check</code> locally → if clean, sign with <code>scripts/sign.mjs</code> and open PR</li>
        </ol>
      </div>
    </div>
  )
}

function Panel({ title, subtitle, value, onChange, placeholder, stats, dir }: {
  title: string
  subtitle: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  stats: string
  dir: 'ltr' | 'rtl'
}) {
  return (
    <div className="flex flex-col rounded-md border border-paper-300 bg-paper-50 p-4">
      <div className="flex items-baseline justify-between gap-3 border-b border-paper-200 pb-2.5">
        <div>
          <h3 className="text-[14px] font-semibold tracking-tight text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            {title}
          </h3>
          <p className="text-[11px] italic text-ink-500">{subtitle}</p>
        </div>
        <span className="text-[10px] tabular text-ink-500">{stats}</span>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        rows={14}
        className="mt-3 w-full flex-1 resize-y rounded border border-paper-200 bg-white px-3 py-2.5 text-[14px] leading-relaxed text-ink-900 transition focus:border-source-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-source-600"
        style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
      />
    </div>
  )
}
