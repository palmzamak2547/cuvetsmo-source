'use client'

// Dosage table with a species filter.
//
// Desktop: the same 5-column table as before. Below `md` the `.dose-table`
// CSS (globals.css) turns each row into a card — a five-column table on a
// 390px phone is the one thing a vet at 23:00 cannot read. The filter chips
// only render when an entry has ≥ 2 species, so single-species entries stay
// exactly as they were. Pure React state, no dependency.

import { useMemo, useState } from 'react'
import type { Dosage } from '@/lib/drugs'

const SPECIES_TH: Record<string, string> = {
  canine: 'สุนัข', feline: 'แมว', equine: 'ม้า', bovine: 'โค', porcine: 'สุกร',
  ovine: 'แกะ', caprine: 'แพะ', avian: 'สัตว์ปีก', rabbit: 'กระต่าย', rodent: 'สัตว์ฟันแทะ', other: 'อื่น ๆ',
}

export default function DoseTable({
  dosages,
  citeIndex,
}: {
  dosages: Dosage[]
  /** citation id → 1-based reference number, from the entry's citations[] order */
  citeIndex: Record<string, number>
}) {
  const species = useMemo(() => [...new Set(dosages.map(d => d.species))], [dosages])
  const [active, setActive] = useState<string | null>(null)
  const rows = active ? dosages.filter(d => d.species === active) : dosages

  return (
    <div>
      {species.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 font-sans" role="group" aria-label="Filter doses by species">
          <Chip active={active === null} onClick={() => setActive(null)}>
            All species <Count n={dosages.length} />
          </Chip>
          {species.map(s => (
            <Chip key={s} active={active === s} onClick={() => setActive(active === s ? null : s)}>
              <span className="capitalize">{s}</span>
              <span className="ml-1 opacity-70">{SPECIES_TH[s] ?? ''}</span>
              <Count n={dosages.filter(d => d.species === s).length} />
            </Chip>
          ))}
        </div>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {rows.length} of {dosages.length} doses shown
      </p>

      <div className="overflow-x-auto rounded-md border border-paper-300">
        <table className="dose-table min-w-full text-sm tabular">
          <thead className="border-b border-paper-300 bg-paper-100/70 text-[11px] uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Species</th>
              <th className="px-4 py-2.5 text-left font-medium">Indication</th>
              <th className="px-4 py-2.5 text-left font-medium">Route</th>
              <th className="px-4 py-2.5 text-left font-medium">Dose</th>
              <th className="px-4 py-2.5 text-left font-medium">Cite</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d, i) => (
              <tr key={`${d.species}-${d.route}-${i}`} className="border-t border-paper-200 hover:bg-paper-100/50">
                <td data-label="Species" className="px-4 py-3 capitalize">{d.species}</td>
                <td data-label="Indication" className="px-4 py-3">{d.indication}</td>
                <td data-label="Route" className="px-4 py-3">
                  <span className="font-mono text-xs text-source-800">{d.route}</span>
                </td>
                <td data-label="Dose" className="px-4 py-3">
                  <span className="dose font-mono text-[13px]">{d.dose}</span>
                  {d.duration && <span className="block text-[11px] text-ink-500">{d.duration}</span>}
                  {d.notes && <span className="block text-[11px] text-ink-500">{d.notes}</span>}
                </td>
                <td data-label="Cite" className="px-4 py-3">
                  {d.cites.length > 0 && (
                    <sup>
                      {d.cites.map((id, idx) => {
                        const n = citeIndex[id]
                        if (!n) return <span key={id} className="text-amber-600">[?]</span>
                        return (
                          <a key={id} href={`#cite-${id}`} className="cite-token" aria-label={`citation ${n}`}>
                            [{n}]{idx < d.cites.length - 1 && <span aria-hidden> </span>}
                          </a>
                        )
                      })}
                    </sup>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] transition ${
        active
          ? 'border-source-700 bg-source-800 text-paper-50'
          : 'border-paper-300 bg-paper-50 text-ink-700 hover:border-source-500 hover:text-source-800'
      }`}
    >
      {children}
    </button>
  )
}

function Count({ n }: { n: number }) {
  return <span className="ml-1.5 rounded-full bg-paper-200/70 px-1.5 py-px text-[10px] font-semibold tabular text-ink-700">{n}</span>
}
