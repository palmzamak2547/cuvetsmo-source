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
import { SPECIES_TH } from '@/lib/species'

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
  // Body-weight helper: pure arithmetic on the FIRST "n mg/kg" in the row,
  // always shown next to its basis so it can be checked. Rows without a
  // per-kg figure get nothing. Reference arithmetic, not a prescription.
  const [weight, setWeight] = useState('')
  const kg = Number(weight)
  const hasKg = Number.isFinite(kg) && kg > 0
  const anyPerKg = useMemo(() => dosages.some(d => PER_KG.test(d.dose)), [dosages])

  return (
    <div>
      {anyPerKg && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[12px] text-ink-700">
          <label htmlFor="dose-weight" className="font-semibold uppercase tracking-wider text-[10px] text-ink-500">น้ำหนักตัว</label>
          <span className="inline-flex items-center gap-1.5">
            <input
              id="dose-weight"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="0"
              className="w-20 rounded-md border border-paper-300 bg-paper-50 px-2 py-1 text-right tabular text-ink-900 focus:border-source-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-source-600"
            />
            kg
          </span>
          <span className="text-[11px] text-ink-500">
            คูณจาก mg/kg ตัวแรกของแต่ละแถว — แสดงที่มาไว้ให้ตรวจ ยืนยันกับตำราก่อนใช้เสมอ
          </span>
        </div>
      )}
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
                  {hasKg && (() => {
                    const c = perKg(d.dose, kg)
                    return c ? (
                      <span className="mt-1 block font-mono text-[12px] text-source-800" title={`${c.basis} × ${kg} kg`}>
                        ≈ {c.total} <span className="text-ink-500">({c.basis} × {kg} kg)</span>
                      </span>
                    ) : null
                  })()}
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

// "0.1–0.2 mg/kg", "140 mg/kg", "1–5 g/kg", "20 IU/kg" — first match only.
const PER_KG = /(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?\s*(mg|mcg|µg|μg|IU|U|units?|g|mL|ml)\s*\/\s*kg/i

function perKg(dose: string, kg: number): { total: string; basis: string } | null {
  const m = dose.match(PER_KG)
  if (!m) return null
  const unit = m[3].replace(/^units?$/i, 'U').replace(/^μg$/, 'µg')
  const fmt = (n: number) => (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)).replace(/\.0+$|(\.\d*[1-9])0+$/, '$1')
  const lo = parseFloat(m[1]) * kg
  const hi = m[2] ? parseFloat(m[2]) * kg : null
  return {
    total: hi !== null ? `${fmt(lo)}–${fmt(hi)} ${unit}` : `${fmt(lo)} ${unit}`,
    basis: m[0].replace(/\s+/g, ' '),
  }
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
