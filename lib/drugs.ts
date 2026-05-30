// Drug entry schema for source.cuvetsmo.com.
//
// Provenance-first design — every entry tracks WHERE its content was
// mirrored from, WHO reviewed the Thai translation, and WHEN. The trust
// stamp on the entry page reads those fields directly. No entry can
// publish as canonical without a faculty signature in `signatures[]`.
//
// Phase 0 (this file) implements the schema shape for the moonshot
// 8-primitive synthesis described in ARCHITECTURE.md:
//
//   P1  Cryptographic provenance   →  signatures[]
//   P2  Content-addressed citations →  mirrorCIDs[] + content/citations/<cid>
//   P3  AI in loop, never authority →  drafting{}
//   P4  ZK-proof of license        →  reviewer.did + reviewer.signerKeyId
//   P5  Medical ontology backbone  →  codes{}
//   P6  Inverted API economics     →  (lib/auth.ts, separate file)
//   P7  Git-native + PR review     →  content/drugs/<slug>.json on disk
//   P8  Offline PWA + WebGPU LLM   →  (public/sw.js, separate file)
//
// Iron Rule 0 is enforced by:
//   - publishedDrugs() filter — only entries with `reviewedBy !== null`
//     AND `signatures.length > 0`
//   - amber PENDING banner on any entry that fails that gate
//   - verify-content CI lint (scripts/verify.ts) that fails the build
//     if a canonical entry has dangling citations, missing codes, or
//     an unverifiable signature
//   - drafting.aiAssisted forces visible "AI-assisted draft" badge

// ─── Citations + clinical content ─────────────────────────────────────

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
  /** Content-addressed snapshot of this citation. Set if we mirrored
   *  the source bytes; null while still relying on the upstream URL. */
  cid?: string | null
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

// ─── Primitive 5 · ontology codes ─────────────────────────────────────

export type OntologyCodes = {
  /** RxNorm Concept Unique Identifier (US, NLM). */
  rxnorm?: { cui: string; name: string }
  /** WHO Anatomical Therapeutic Chemical code. Level 5 is most specific. */
  atc?: { code: string; name: string; level: 1 | 2 | 3 | 4 | 5 }
  /** SNOMED CT concept ID. Licensing applies — leave empty until cleared. */
  snomed?: { sctid: string; name: string }
  /** LOINC code (rare for drugs, common for lab tests). */
  loinc?: { code: string; name: string }
  /** ICD-11 code (conditions, not drugs — usually empty for Drug entries). */
  icd11?: { code: string; name: string }
  /** Our own veterinary extension code system. */
  vetspecial?: { code: string; system: 'AVMA' | 'CUVET' }
}

// ─── Primitive 4 · reviewer identity (W3C DID-ready) ──────────────────

export type FacultyReview = {
  name: string
  title?: string
  department?: string
  affiliation: string
  date: string
  /** W3C Decentralized Identifier — required once VC pipeline ships
   *  (Week 5). Optional for Week 1-4 entries. */
  did?: string
  /** Fingerprint of the public key this reviewer signed with. Cross-
   *  references with signatures[].signerKeyId. */
  signerKeyId?: string
}

// ─── Community attestations (verification ladder, tier 2) ─────────────
// A low-friction trust signal between "Sourced" and "Expert-reviewed".
// An attestation = a named contributor (vet student, practitioner, or
// faculty) who checked the entry against the cited sources and affirms it
// matches. Logged transparently. Two independent attestations promote an
// entry from "Sourced" to "Community-checked". This is the network-effect
// layer — a static copy of the catalog can never replicate a living
// community of checkers.
export type Attestation = {
  /** Display name or handle of the attester. */
  attesterName: string
  /** Role gives weight context (not authority — that's the expert tier). */
  attesterRole: 'vet-student' | 'practitioner' | 'faculty' | 'pharmacist' | 'other'
  /** Optional verifiable identity (license no., ORCID, GitHub) — shown as provenance. */
  attesterId?: string
  /** ISO date of the attestation. */
  attestedAt: string
  /** Which version of the entry was checked (so stale attestations are visible). */
  drugVersion: number
  /** Optional note — e.g. "checked dog dose against Plumb's 9th ed p.512". */
  note?: string
}

// ─── Primitive 1 · cryptographic signatures ───────────────────────────

export type Signature = {
  /** Stable ID of the signing party, e.g. "ekkapol.akb" or "cuvetsmo-board". */
  signerId: string
  /** Human-readable display name. Falls back to signerId if absent. */
  signerName: string
  /** Fingerprint of the public key. Must match an entry in content/keys/. */
  signerKeyId: string
  /** SHA-256 hex of the canonical content JSON at the time of signing.
   *  Canonical form: sorted keys, no whitespace, drop signatures[] field
   *  itself before hashing. */
  contentHash: string
  /** Detached Ed25519 signature over `contentHash`, base64-encoded. */
  signature: string
  /** ISO 8601 timestamp when the signature was produced. */
  signedAt: string
  /** Optional transparency-log URL. Empty in Week 1 (log is git-tracked file). */
  logUrl?: string
}

// ─── Primitive 3 · AI drafting metadata ───────────────────────────────

export type DraftingMeta = {
  /** True if any AI model contributed to the draft text. */
  aiAssisted: boolean
  /** Model identifier, e.g. "claude-sonnet-4.7" or "gpt-4-turbo". null
   *  if aiAssisted is false. */
  aiModel: string | null
  /** SHA-256 of the prompt used. We hash so the prompt itself stays
   *  private but reproducibility is verifiable. null if aiAssisted is false. */
  aiPromptHash: string | null
  /** GitHub username (or stable ID) of the human who finalized the entry.
   *  Required for any entry to ship — Iron Rule 0. */
  humanReviewer: string | null
  /** ISO date when the human review completed. */
  humanReviewedAt: string | null
  /** Approximate fraction (0..1) of bytes the human changed from the AI
   *  draft. 0 = pure AI accepted as-is (rejected by Iron Rule 0).
   *  null = pure human authorship, no AI involved. */
  humanEditsRatio: number | null
}

// ─── Primitive 2 · mirror provenance (with content-addressed snapshot) ─

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

export type MirrorCID = {
  /** Matches MirrorSource.id. */
  sourceId: string
  /** SHA-256 hash of canonical metadata (or full bytes if mirrored). */
  cid: string
  /** ISO timestamp when this snapshot was captured. */
  capturedAt: string
  /** Path relative to repo root where bytes are stored. Empty for stubs. */
  bytesPath?: string
  /**
   *  - stub:     metadata-only snapshot, content lives at the upstream URL
   *  - mirrored: full bytes mirrored to bytesPath, hash verifies
   *  - rotted:   we tried to refresh and the upstream is gone or changed
   */
  status: 'stub' | 'mirrored' | 'rotted'
}

// ─── Drug entry ───────────────────────────────────────────────────────

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
   *  mirrored entries; null only when authored from scratch. */
  mirroredFrom: MirrorSource[] | null

  /** Content-addressed snapshots of each mirror source. */
  mirrorCIDs: MirrorCID[]

  /** Cross-references to canonical machine-readable code systems. */
  codes: OntologyCodes

  /** AI-vs-human authorship metadata. Required (Iron Rule 0). */
  drafting: DraftingMeta

  /** Cryptographic signatures by faculty reviewers. Empty until signed. */
  signatures: Signature[]

  /** Human-readable reviewer info. Mirrors the latest signature in
   *  display form. null = not yet expert-reviewed (but may still be
   *  Sourced or Community-checked — see verificationTier). */
  reviewedBy: FacultyReview | null

  /** Community attestations — the middle rung of the verification ladder.
   *  Optional; absent or short array = entry sits at the Sourced tier. */
  attestations?: Attestation[]

  lastUpdated: string
  version: number
  changelog?: { version: number; date: string; summary: string }[]
}

// ─── Content loading ──────────────────────────────────────────────────
// Content lives at content/drugs/<slug>.json — flat files, git-tracked,
// PR-reviewed (Primitive 7). At module load time we read every JSON
// file in that directory and re-export them as a typed array.
//
// Why fs.readdirSync instead of static imports: adding a new entry =
// one JSON file dropped into content/drugs/, no code change required.
// This runs once per server lifetime (build-time for static pages).
//
// SERVER-SIDE ONLY. Client components must receive drug data via
// server-component props, not by importing this module directly.

import { readdirSync, readFileSync } from 'fs'
import path from 'path'

function loadAllDrugs(): Drug[] {
  const dir = path.join(process.cwd(), 'content', 'drugs')
  const files = readdirSync(dir).filter(f => f.endsWith('.json'))
  return files
    .map(f => JSON.parse(readFileSync(path.join(dir, f), 'utf8')) as Drug)
    // Stable order: by slug alphabetical. Callers can re-sort downstream.
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

// In production, this runs once at build time (server bundle init).
// In dev, the module reloads on source-file changes — adding new drug
// JSON files without touching lib/ won't be picked up until the server
// restarts. Touch this file or restart dev when content/drugs/ changes.
export const DRUGS: Drug[] = loadAllDrugs()

// ─── Lookups ──────────────────────────────────────────────────────────

export function findDrug(slug: string): Drug | undefined {
  return DRUGS.find(d => d.slug === slug)
}

export function findCitation(drug: Drug, id: string): Citation | undefined {
  return drug.citations.find(c => c.id === id)
}

// ─── Verification ladder ──────────────────────────────────────────────
// A spectrum, not a locked gate. The original binary (canonical-or-pending)
// made faculty Ed25519 signing the SINGLE point of failure — if no faculty
// signed, every entry read "Not for clinical use" forever. That is the
// vaporware failure mode. Instead, trust is earned in achievable rungs:
//
//   sourced    — every claim cited + cross-checked across ≥2 authoritative
//                sources, content-addressed. Reference-grade. The default,
//                and genuinely useful: confirm dose against your formulary
//                before clinical use, exactly as you would with any tertiary
//                reference.
//   community  — ≥2 independent contributors attested the entry matches its
//                cited sources. The network-effect rung — uncopyable.
//   expert     — a named, identity-verified vet/faculty endorsed it. The
//                signature seals the record for tamper-evidence; the endorser
//                does NOT need to manage a private key (the platform can sign
//                on record of their explicit, logged approval — DocuSign model,
//                with self-custody signing still available for those who want it).

export type VerificationTier = 'sourced' | 'community' | 'expert'

const MIN_COMMUNITY_ATTESTATIONS = 2

export function verificationTier(drug: Drug): VerificationTier {
  if (drug.reviewedBy !== null && drug.signatures.length > 0) return 'expert'
  if ((drug.attestations?.length ?? 0) >= MIN_COMMUNITY_ATTESTATIONS) return 'community'
  return 'sourced'
}

/** How many fresh (current-version) attestations an entry has. */
export function freshAttestations(drug: Drug): Attestation[] {
  return (drug.attestations ?? []).filter(a => a.drugVersion === drug.version)
}

/**
 * Expert-reviewed = faculty-reviewed AND at least one valid signature.
 * Retained under the old name for back-compat with callers that gate the
 * top tier (e.g. the verify.mjs TEMPLATE check, /trust hierarchy).
 */
export function isCanonical(drug: Drug): boolean {
  return verificationTier(drug) === 'expert'
}

/** Entries that have reached the top (expert) rung. */
export function expertReviewedDrugs(): Drug[] {
  return DRUGS.filter(d => verificationTier(d) === 'expert')
}

/** Back-compat alias. */
export const publishedDrugs = expertReviewedDrugs

/** Entries not yet at the expert rung (sourced or community). */
export function pendingDrugs(): Drug[] {
  return DRUGS.filter(d => verificationTier(d) !== 'expert')
}
