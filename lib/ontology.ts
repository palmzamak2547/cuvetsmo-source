// Medical ontology backbone · Primitive 5.
//
// Cross-references every entry to canonical machine-readable code systems
// so downstream consumers (hospital EHR, research datasets, AI agents)
// can join on stable IDs rather than free-text strings.
//
// Code systems supported in Week 1:
//   - ATC    (WHO Anatomical Therapeutic Chemical) — drug class taxonomy
//   - RxNorm (NLM)                                 — US drug CUI registry
//
// Coming in Week 5:
//   - SNOMED CT (licensing pending — free in TH under WHO IGO)
//   - LOINC (NLM)
//   - ICD-11 (WHO)
//
// Data files live at `data/ontology/<system>.json`. They are a curated
// subset of the upstream code list, scoped to the entities we cover.
// Build script (Week 3+) will pull-sync these from upstream.

import atcData from '../data/ontology/atc.json'
import rxnormData from '../data/ontology/rxnorm-vet.json'
import icd11Data from '../data/ontology/icd11-vet.json'
import loincData from '../data/ontology/loinc-vet.json'

import type { OntologyCodes } from './drugs'

// ─── ATC ──────────────────────────────────────────────────────────────

export type AtcEntry = {
  code: string
  name: string
  level: 1 | 2 | 3 | 4 | 5
  /** Parent code at level - 1. Empty string for level-1 anatomical groups. */
  parent: string
}

const ATC_INDEX = atcData as unknown as Record<string, AtcEntry>

export function lookupATC(code: string): AtcEntry | undefined {
  return ATC_INDEX[code.toUpperCase()]
}

/**
 * Walk up the ATC tree from a level-5 code to its root.
 * Returns [level-1, level-2, level-3, level-4, level-5] for a leaf code.
 */
export function atcPath(code: string): AtcEntry[] {
  const result: AtcEntry[] = []
  let cur: string | undefined = code.toUpperCase()
  while (cur) {
    const entry: AtcEntry | undefined = ATC_INDEX[cur]
    if (!entry) break
    result.unshift(entry)
    cur = entry.parent || undefined
  }
  return result
}

// ─── RxNorm ───────────────────────────────────────────────────────────

export type RxNormEntry = {
  cui: string
  name: string
  synonyms?: string[]
  /** Notable cross-references to other code systems. */
  xrefs?: { system: string; code: string }[]
}

const RXNORM_INDEX = rxnormData as unknown as Record<string, RxNormEntry>

export function lookupRxNorm(cui: string): RxNormEntry | undefined {
  return RXNORM_INDEX[cui]
}

// ─── ICD-11 ───────────────────────────────────────────────────────────

export type Icd11Entry = {
  code: string
  name: string
  chapter: string
  note?: string
}

const ICD11_INDEX = icd11Data as unknown as Record<string, Icd11Entry>

export function lookupICD11(code: string): Icd11Entry | undefined {
  return ICD11_INDEX[code]
}

// ─── LOINC ────────────────────────────────────────────────────────────

export type LoincEntry = {
  code: string
  name: string
  system: string
  scaleType: string
  note?: string
}

const LOINC_INDEX = loincData as unknown as Record<string, LoincEntry>

export function lookupLOINC(code: string): LoincEntry | undefined {
  return LOINC_INDEX[code]
}

// ─── Validation (used by scripts/verify.ts) ───────────────────────────

export type OntologyValidation = {
  ok: boolean
  issues: string[]
}

/**
 * Validate that every code in `codes` resolves in our local ontology
 * mirror. Iron Rule 0: if we cite a code, it MUST exist; we cannot
 * fabricate codes that nobody else has heard of.
 *
 * For ontologies not yet shipped (SNOMED, LOINC, ICD-11), validation
 * is skipped with a warning rather than a hard fail.
 */
export function validateCodes(codes: OntologyCodes): OntologyValidation {
  const issues: string[] = []

  if (codes.atc) {
    const found = lookupATC(codes.atc.code)
    if (!found) {
      issues.push(`ATC code "${codes.atc.code}" not in local mirror`)
    } else if (found.level !== codes.atc.level) {
      issues.push(`ATC code "${codes.atc.code}" claimed level ${codes.atc.level}, registry says ${found.level}`)
    }
  }

  if (codes.rxnorm) {
    const found = lookupRxNorm(codes.rxnorm.cui)
    if (!found) {
      issues.push(`RxNorm CUI "${codes.rxnorm.cui}" not in local mirror`)
    }
  }

  if (codes.snomed) {
    issues.push(`SNOMED CT validation skipped (licensing pending)`)
  }

  if (codes.loinc) {
    const found = lookupLOINC(codes.loinc.code)
    if (!found) {
      issues.push(`LOINC code "${codes.loinc.code}" not in local mirror`)
    }
  }

  if (codes.icd11) {
    const found = lookupICD11(codes.icd11.code)
    if (!found) {
      issues.push(`ICD-11 code "${codes.icd11.code}" not in local mirror`)
    }
  }

  // The skips are warnings, not errors. Only "not in local mirror"
  // counts as an actual failure.
  const hardFailures = issues.filter(s => !s.includes('skipped'))
  return { ok: hardFailures.length === 0, issues }
}

// ─── Display helpers ──────────────────────────────────────────────────

export function formatATC(entry: { code: string; name: string }): string {
  return `${entry.code} · ${entry.name}`
}

export function formatRxNorm(entry: { cui: string; name: string }): string {
  return `RxNorm ${entry.cui} · ${entry.name}`
}
