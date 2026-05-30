// Therapeutic class classification + slug system for browse pages.
//
// The /drugs catalog groups entries by therapeutic class derived from
// each drug's WHO ATC code. This module is the single source of truth
// for that mapping — imported by /drugs (list), /drugs/class/[slug]
// (filtered view), and the search index.
//
// Adding a new class:
//   1. Add a row to THERAPEUTIC_CLASSES below.
//   2. Update classifyDrug() if the routing logic needs to change.
//   3. The class browse page at /drugs/class/<slug> auto-appears.

import type { Drug } from './drugs'

export type TherapeuticClass = {
  /** URL-safe slug used in routes. */
  slug: string
  /** Bilingual label shown to readers. */
  label: string
  /** Short Thai/EN subtitle for header hero. */
  subtitle: string
  /** Display order on browse pages. */
  order: number
  /** Matcher — does this drug belong to this class? */
  match: (drug: Drug) => boolean
}

// WHO veterinary ATC codes use a "Q" prefix on top of the human ATC.
// For classification we strip it — QC01CE90 (Pimobendan vet) classifies
// the same as C01CE-style cardiac codes.
const stripQ = (code: string) => (code.startsWith('Q') ? code.slice(1) : code)

const startsWithAtc = (...prefixes: string[]) => (d: Drug) => {
  const code = stripQ(d.codes?.atc?.code ?? '')
  return prefixes.some(p => code.startsWith(p))
}

export const THERAPEUTIC_CLASSES: TherapeuticClass[] = [
  {
    slug: 'nsaids',
    label: 'NSAIDs · ยาแก้อักเสบแบบ non-steroid',
    subtitle: 'COX inhibitors — pain, inflammation, post-op analgesia',
    order: 10,
    match: startsWithAtc('M01A'),
  },
  {
    slug: 'opioids',
    label: 'Opioids · ยาแก้ปวดกลุ่ม opioid',
    subtitle: 'μ-agonists, partial agonists, κ-agonists — moderate to severe pain',
    order: 20,
    match: startsWithAtc('N02A', 'N07BC'),
  },
  {
    slug: 'anesthetics-sedatives',
    label: 'Anesthetics & sedatives · ยาดมสลบและยาสงบประสาท',
    subtitle: 'General anesthetics, benzodiazepines, α2-agonists, phenothiazines',
    order: 30,
    match: startsWithAtc('N01', 'N05A', 'N05B', 'N05C'),
  },
  {
    slug: 'antibiotics',
    label: 'Antibiotics · ยาต้านแบคทีเรีย',
    subtitle: 'β-lactams, tetracyclines, fluoroquinolones, nitroimidazoles',
    order: 40,
    match: startsWithAtc('J01', 'P01AB'),
  },
  {
    slug: 'antifungals',
    label: 'Antifungals · ยาต้านเชื้อรา',
    subtitle: 'Imidazoles + triazoles + allylamines, systemic & dermatological',
    order: 50,
    match: startsWithAtc('J02', 'D01'),
  },
  {
    slug: 'antiparasitics',
    label: 'Antiparasitics · ยาฆ่าพยาธิ',
    subtitle: 'Anthelmintics, endectocides, isoxazolines, anticoccidials',
    order: 60,
    match: startsWithAtc('P02', 'P51', 'P53', 'P54'),
  },
  {
    slug: 'gi',
    label: 'GI · ระบบทางเดินอาหาร',
    subtitle: 'PPIs, H2 blockers, prokinetics — acid suppression + motility',
    order: 70,
    match: (d) => startsWithAtc('A02', 'A03')(d),
  },
  {
    slug: 'anti-emetics',
    label: 'Anti-emetics · ยาแก้อาเจียน',
    subtitle: '5-HT3 antagonists, NK1 antagonists',
    order: 80,
    match: startsWithAtc('A04'),
  },
  {
    slug: 'antihistamines',
    label: 'Antihistamines · ยาต้านฮิสตามีน',
    subtitle: 'H1-receptor antagonists — first + second generation',
    order: 90,
    match: startsWithAtc('R06'),
  },
  {
    slug: 'cardiovascular',
    label: 'Cardiovascular · ระบบหัวใจ',
    subtitle: 'Diuretics, ACE inhibitors, cardiac glycosides',
    order: 100,
    match: startsWithAtc('C0'),
  },
  {
    slug: 'endocrine',
    label: 'Endocrine · ระบบต่อมไร้ท่อ',
    subtitle: 'Thyroid hormones, antithyroid agents',
    order: 110,
    match: startsWithAtc('H03'),
  },
  {
    slug: 'corticosteroids',
    label: 'Corticosteroids · ยาคอร์ติโคสเตียรอยด์',
    subtitle: 'Glucocorticoids — prednisolone, dexamethasone, prednisone',
    order: 115,
    match: startsWithAtc('H02'),
  },
  {
    slug: 'anticonvulsants',
    label: 'Anticonvulsants · ยากันชัก',
    subtitle: 'Barbiturates, benzodiazepines (anti-epileptic use)',
    order: 120,
    match: startsWithAtc('N03'),
  },
  {
    slug: 'diabetes',
    label: 'Diabetes · ยาเบาหวาน',
    subtitle: 'Insulins and analogues',
    order: 130,
    match: startsWithAtc('A10'),
  },
  {
    slug: 'hematology',
    label: 'Hematology · ยาเลือดและการแข็งตัว',
    subtitle: 'Anticoagulants, antiplatelets, heparin group',
    order: 140,
    match: startsWithAtc('B01'),
  },
  {
    slug: 'antidotes',
    label: 'Antidotes · ยาต้าน/แก้พิษ',
    subtitle: 'Opioid antagonists, α2-antagonist reversal, vitamin K, other antidotes',
    order: 150,
    match: startsWithAtc('V03', 'B02BA'),
  },
  {
    slug: 'muscle-relaxants',
    label: 'Muscle relaxants · ยาคลายกล้ามเนื้อ',
    subtitle: 'Centrally-acting muscle relaxants — tremorgenic toxicity, muscle spasm',
    order: 155,
    match: startsWithAtc('M03'),
  },
  {
    slug: 'immunomodulators',
    label: 'Immunomodulators · ยากดภูมิคุ้มกัน',
    subtitle: 'Calcineurin inhibitors, atopic dermatitis, transplant medicine',
    order: 160,
    match: startsWithAtc('L04'),
  },
  {
    slug: 'cns-psychotropic',
    label: 'CNS · ยาด้านจิตเวช · appetite stimulants',
    subtitle: 'Antidepressants used as appetite stimulants in vet (mirtazapine), other psychotropics',
    order: 170,
    match: startsWithAtc('N06'),
  },
  {
    slug: 'respiratory',
    label: 'Respiratory · ระบบทางเดินหายใจ',
    subtitle: 'Xanthines, bronchodilators, theophylline, respiratory stimulants',
    order: 180,
    match: startsWithAtc('R03', 'R07'),
  },
  {
    slug: 'emergency-cardiac',
    label: 'Emergency & cardiac stimulants · ยาฉุกเฉินกระตุ้นหัวใจ',
    subtitle: 'Adrenergic/dopaminergic agents — epinephrine, dopamine, dobutamine (CPR, shock, inotropy)',
    order: 185,
    match: startsWithAtc('C01CA'),
  },
  {
    slug: 'fluids-electrolytes',
    label: 'Fluids & electrolytes · สารน้ำและเกลือแร่',
    subtitle: 'Osmotic diuretics, electrolyte replacement, dextrose',
    order: 190,
    match: startsWithAtc('B05', 'A12', 'V06D'),
  },
  {
    slug: 'toxicology-emesis',
    label: 'Toxicology & emesis · พิษวิทยาและยากระตุ้นอาเจียน',
    subtitle: 'Emetics, adsorbents, antidotes for poisoning + decontamination',
    order: 195,
    match: startsWithAtc('A07BA', 'V03AB25', 'V03AB07'),
  },
  {
    slug: 'pituitary-hormones',
    label: 'Pituitary hormones · ฮอร์โมนต่อมใต้สมอง',
    subtitle: 'Vasopressin analogues (desmopressin) — central diabetes insipidus',
    order: 200,
    match: startsWithAtc('H01B'),
  },
  {
    slug: 'antineoplastics',
    label: 'Antineoplastics · ยาเคมีบำบัด',
    subtitle: 'Cytotoxic chemotherapy — vinca alkaloids, alkylating agents',
    order: 205,
    match: startsWithAtc('L01'),
  },
]

/**
 * Find which therapeutic class a drug belongs to. Returns the first
 * matcher in display-order priority.
 */
export function classifyDrug(drug: Drug): TherapeuticClass | undefined {
  return THERAPEUTIC_CLASSES.find(c => c.match(drug))
}

/**
 * Resolve a class slug to its definition. URL → class.
 */
export function findClassBySlug(slug: string): TherapeuticClass | undefined {
  return THERAPEUTIC_CLASSES.find(c => c.slug === slug)
}

/**
 * Group drugs by therapeutic class, return sorted groups.
 * Skips empty classes.
 */
export function groupDrugsByClass(drugs: Drug[]): Array<{ klass: TherapeuticClass; entries: Drug[] }> {
  const map = new Map<string, Drug[]>()
  for (const d of drugs) {
    const klass = classifyDrug(d)
    const key = klass?.slug ?? 'other'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(d)
  }
  const groups: Array<{ klass: TherapeuticClass; entries: Drug[] }> = []
  for (const klass of THERAPEUTIC_CLASSES) {
    const entries = map.get(klass.slug)
    if (entries && entries.length > 0) {
      groups.push({ klass, entries: entries.slice().sort((a, b) => a.nameEn.localeCompare(b.nameEn)) })
    }
  }
  return groups
}
