import type { Drug } from '@/lib/drugs'

// Species covered by the dosage rows — the first thing a clinician scans for
// on a card ("does this have a feline dose?"). Derived from data, never typed.
export function SpeciesFacets({ drug }: { drug: Drug }) {
  const species = [...new Set(drug.dosages.map(d => d.species))]
  if (species.length === 0) return null
  return (
    <p className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase tracking-wider text-ink-500" aria-label="Species with dosing">
      {species.map(s => (
        <span key={s} className="rounded-sm bg-paper-200/80 px-1.5 py-0.5">{s}</span>
      ))}
    </p>
  )
}
