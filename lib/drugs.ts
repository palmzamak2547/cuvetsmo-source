// Drug entry schema for source.cuvetsmo.com.
//
// Provenance-first design — every entry tracks WHERE its content was
// mirrored from + WHO reviewed the Thai translation + WHEN. The trust
// stamp on the entry page reads those fields directly; no entry can
// publish as canonical without `reviewedBy !== null`.
//
// Mirror strategy (per Palm 2026-05-27 founder-vision session):
//
//   Day 1   · Seed from authoritative open sources (DailyMed, WHO
//             Essential Medicines List, Thai FDA, PubChem, WSAVA
//             guidelines). Each seeded entry is "Mirrored from X ·
//             Thai translation pending · Faculty review pending"
//             and rendered with an amber PENDING banner.
//
//   Day 30  · Faculty reviewer queue clears initial 10-20 entries.
//             Reviewer signs off, banner flips to emerald.
//
//   Day 365 · 100+ entries canonical. Volume + provenance compound
//             into a defensible Thai medical knowledge dataset.
//
// Iron Rule 0 is enforced by:
//   - publishedDrugs() filter (only entries with `reviewedBy !== null`)
//   - amber PENDING banner on any entry without faculty signoff
//   - mandatory `mirroredFrom` field tracking source URL
//   - citation `type` enum that distinguishes real sources from
//     placeholders

export type CitationType =
  | 'textbook'
  | 'paper'
  | 'guideline'
  | 'package-insert'
  | 'faculty-statement'
  | 'monograph'
  | 'regulatory-database'

export type Citation = {
  id: string
  type: CitationType
  title: string
  authors?: string
  year?: number
  edition?: string
  pageOrSection?: string
  url?: string
  note?: string
}

export type Species =
  | 'canine'
  | 'feline'
  | 'equine'
  | 'bovine'
  | 'porcine'
  | 'ovine'
  | 'caprine'
  | 'avian'
  | 'rabbit'
  | 'rodent'
  | 'other'

export type Route =
  | 'IV'
  | 'IM'
  | 'SC'
  | 'PO'
  | 'IA'
  | 'IO'
  | 'IP'
  | 'topical'
  | 'inhaled'
  | 'rectal'
  | 'ocular'
  | 'aural'

export type Dosage = {
  species: Species
  indication: string
  route: Route
  dose: string
  duration?: string
  notes?: string
  cites: string[]
}

export type ClinicalSection = {
  text: string
  cites: string[]
}

export type FacultyReview = {
  name: string
  title?: string
  department?: string
  affiliation: string
  date: string
}

export type MirrorSource = {
  /** Short stable ID for the source dataset, e.g. "dailymed", "who-eml-22". */
  id: string
  /** Full source name as displayed to readers. */
  name: string
  /** URL to the source's home/landing page. */
  url: string
  /** URL to the SPECIFIC entry we mirrored from, if applicable. */
  entryUrl?: string
  /** Effective date / version of the source data when mirrored. */
  asOfDate?: string
  /** License / attribution requirements. */
  license: string
}

export type Drug = {
  slug: string
  nameEn: string
  nameTh: string
  /** Pharmacological class (free text). */
  class: string
  mechanism?: string
  brandNamesTh?: string[]

  indications: ClinicalSection[]
  contraindications: ClinicalSection[]
  sideEffects: ClinicalSection[]
  dosages: Dosage[]
  interactions?: ClinicalSection[]
  monitoring?: ClinicalSection[]
  storage?: ClinicalSection[]
  pregnancyLactation?: ClinicalSection[]

  citations: Citation[]

  /** Where the structured fields originated. Always populated for
   *  mirrored entries; null only when the entry was authored from
   *  scratch by a faculty contributor. */
  mirroredFrom: MirrorSource[] | null

  /** Reviewer signoff. null = entry is template/pending, NOT canonical. */
  reviewedBy: FacultyReview | null

  lastUpdated: string
  version: number
  changelog?: { version: number; date: string; summary: string }[]
}

// ─── Seed data ────────────────────────────────────────────────────────
// We start with ONE structurally complete entry that demonstrates the
// mirror + citation pattern without making any clinical claims. Real
// dose values, indication details, contraindication lists etc. are
// left as TEMPLATE placeholders for the first Thai-translation +
// faculty-review cycle. The citations point at real, verifiable URLs
// on authoritative sites so reviewers can see the shape we expect.

import meloxicamSeed from '../data/seed/meloxicam.json'

export const DRUGS: Drug[] = [
  meloxicamSeed as Drug,
]

// ─── Lookups ──────────────────────────────────────────────────────────

export function findDrug(slug: string): Drug | undefined {
  return DRUGS.find(d => d.slug === slug)
}

export function findCitation(drug: Drug, id: string): Citation | undefined {
  return drug.citations.find(c => c.id === id)
}

export function publishedDrugs(): Drug[] {
  return DRUGS.filter(d => d.reviewedBy !== null)
}

export function pendingDrugs(): Drug[] {
  return DRUGS.filter(d => d.reviewedBy === null)
}
