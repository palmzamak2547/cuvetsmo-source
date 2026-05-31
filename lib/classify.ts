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
    subtitle: 'PPIs, H2 blockers, prokinetics, laxatives — acid suppression + motility',
    order: 70,
    match: (d) => startsWithAtc('A02', 'A03', 'A06')(d),
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
    // MUST precede cardiovascular: phenoxybenzamine (C04AX02) starts with C0
    // and would otherwise be swallowed by the cardiovascular 'C0' matcher.
    // classifyDrug() returns the FIRST matching class in array order.
    slug: 'urinary',
    label: 'Urinary & micturition · ระบบปัสสาวะและการขับถ่ายปัสสาวะ',
    subtitle: 'Detrusor stimulants, urethral relaxants — retention, atony, dyssynergia',
    order: 95,
    // N07AB cholinergic detrusor stimulants, C04AX urethral relaxants
    // (phenoxybenzamine), G04B urologicals, G04CA alpha-blockers for BPH/
    // urethral relaxation (tamsulosin). G04CA is disjoint from reproductive's
    // G04CB (finasteride 5α-reductase) — tamsulosin relaxes the urethra,
    // finasteride shrinks the prostate, so they live in different classes.
    match: startsWithAtc('N07AB', 'C04AX', 'G04B', 'G04CA'),
  },
  {
    // MUST precede cardiovascular: C01CA (epinephrine/dopamine/dobutamine)
    // starts with C0 and would otherwise be swallowed by the cardiovascular
    // matcher — leaving this emergency class permanently empty. classifyDrug
    // returns the FIRST array match, so order (not the `order` field) decides.
    slug: 'emergency-cardiac',
    label: 'Emergency & cardiac stimulants · ยาฉุกเฉินกระตุ้นหัวใจ',
    subtitle: 'Adrenergic/dopaminergic agents — epinephrine, dopamine, dobutamine (CPR, shock, inotropy)',
    order: 98,
    match: startsWithAtc('C01CA'),
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
    slug: 'adrenal',
    label: 'Adrenal · ยาต่อมหมวกไต',
    subtitle: 'Cushing (trilostane) + Addison (DOCP) — adrenal axis modulators',
    order: 112,
    match: startsWithAtc('H02CA', 'H02AA', 'V03AB99'),
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
    subtitle: 'Anticoagulants, antiplatelets, heparin group, antifibrinolytics (tranexamic acid)',
    order: 140,
    // B01 antithrombotics + B02A antifibrinolytics (tranexamic acid B02AA).
    // B02A is disjoint from antidotes' B02BA (phytomenadione/vitamin K1) —
    // B02AA ≠ B02BA, so the two never collide regardless of array order.
    match: startsWithAtc('B01', 'B02A'),
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
    label: 'Immunomodulators · ยาปรับภูมิคุ้มกัน',
    subtitle: 'Calcineurin inhibitors, antimetabolites, interferons — atopy, IMHA, antiviral immune support',
    order: 160,
    // L04 immunosuppressants + L03 immunostimulants (interferon omega).
    match: startsWithAtc('L04', 'L03'),
  },
  {
    slug: 'cns-psychotropic',
    label: 'CNS · ยาด้านจิตเวช · appetite stimulants',
    subtitle: 'Antidepressants used as appetite stimulants in vet (mirtazapine), NMDA pain adjuncts (amantadine), other psychotropics',
    order: 170,
    // N06 psychoanaleptics + N04BB (amantadine — NMDA antagonist used as a
    // chronic/neuropathic pain adjunct). N04BB is disjoint from apomorphine's
    // N04BC (toxicology-emesis).
    match: startsWithAtc('N06', 'N04BB'),
  },
  {
    slug: 'respiratory',
    label: 'Respiratory · ระบบทางเดินหายใจ',
    subtitle: 'Xanthines, bronchodilators, theophylline, respiratory stimulants',
    order: 180,
    match: startsWithAtc('R03', 'R07'),
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
    match: startsWithAtc('A07BA', 'V03AB25', 'V03AB07', 'N04BC'),
  },
  {
    slug: 'pituitary-hormones',
    label: 'Pituitary hormones · ฮอร์โมนต่อมใต้สมอง',
    subtitle: 'Vasopressin analogues (desmopressin), somatostatin analogues (octreotide)',
    order: 200,
    // H01B posterior-pituitary (desmopressin/oxytocin) + H01CB somatostatins
    // (octreotide). Disjoint from reproductive's H01CA (GnRH).
    match: startsWithAtc('H01B', 'H01CB'),
  },
  {
    slug: 'antineoplastics',
    label: 'Antineoplastics · ยาเคมีบำบัด',
    subtitle: 'Cytotoxic chemotherapy — vinca alkaloids, alkylating agents, anthracyclines',
    order: 205,
    match: startsWithAtc('L01'),
  },
  {
    slug: 'ophthalmology',
    label: 'Ophthalmology · ยาทางตา',
    subtitle: 'Glaucoma agents, mydriatics — topical ocular therapeutics',
    order: 210,
    match: startsWithAtc('S01'),
  },
  {
    slug: 'dermatology',
    label: 'Dermatology · ยาผิวหนัง',
    subtitle: 'Antipruritics, JAK inhibitors (oclacitinib), systemic retinoids (isotretinoin)',
    order: 215,
    // D11 other dermatologicals (oclacitinib) + D10 anti-acne/retinoids
    // (isotretinoin for sebaceous adenitis). Disjoint from D01 antifungals +
    // D06/D08 antiseptics.
    match: startsWithAtc('D11', 'D10'),
  },
  {
    slug: 'antivirals',
    label: 'Antivirals · ยาต้านไวรัส',
    subtitle: 'Nucleoside analogues — feline herpesvirus (famciclovir)',
    order: 220,
    match: startsWithAtc('J05'),
  },
  {
    slug: 'hepatobiliary',
    label: 'Hepatobiliary · ยาตับและทางเดินน้ำดี',
    subtitle: 'Bile acids + hepatoprotectants — cholestasis, liver support',
    order: 225,
    match: startsWithAtc('A05'),
  },
  {
    slug: 'metabolic-nutritional',
    label: 'Metabolic & nutritional · ยาเมตาบอลิกและโภชนาการ',
    subtitle: 'Hepatoprotectants (SAMe), appetite stimulants (capromorelin), vitamin D (calcitriol)',
    order: 230,
    // A16 other alimentary/metabolic + A11 vitamins (calcitriol A11CC for renal
    // secondary hyperparathyroidism).
    match: startsWithAtc('A16', 'A11'),
  },
  {
    slug: 'hematopoietic',
    label: 'Hematopoietic · ยากระตุ้นการสร้างเม็ดเลือด',
    subtitle: 'Erythropoiesis-stimulating agents — anemia of chronic kidney disease',
    order: 235,
    match: startsWithAtc('B03'),
  },
  {
    slug: 'antiseptics',
    label: 'Antiseptics & topical antimicrobials · ยาฆ่าเชื้อและยาทาภายนอก',
    subtitle: 'Biguanides, topical sulfonamides, silver, topical antibiotics — wound + skin',
    order: 245,
    // D08 antiseptics/disinfectants (chlorhexidine) + D06 topical chemo-
    // therapeutics (silver sulfadiazine D06B, mupirocin D06AX). Disjoint from
    // D01 (antifungals) and D11 (dermatology) already in use.
    match: startsWithAtc('D08', 'D06'),
  },
  {
    slug: 'antitussives',
    label: 'Antitussives & expectorants · ยาระงับไอและขับเสมหะ',
    subtitle: 'Cough suppressants (opioid + non-opioid) + expectorants/mucolytics',
    order: 248,
    // R05 cough & cold: R05D suppressants (dextromethorphan/hydrocodone) +
    // R05C expectorants/mucolytics (guaifenesin). Disjoint from respiratory
    // (R03/R07) and antihistamines (R06).
    match: startsWithAtc('R05'),
  },
  {
    slug: 'intestinal',
    label: 'Intestinal — antidiarrheals & IBD · ยาลำไส้และลำไส้อักเสบ',
    subtitle: 'Antidiarrheals, intestinal antibiotics, IBD anti-inflammatories (budesonide, sulfasalazine)',
    order: 250,
    // A07A intestinal antiinfectives (paromomycin), A07D antipropulsives
    // (loperamide), A07E intestinal anti-inflammatories (budesonide/
    // sulfasalazine). EXCLUDES A07BA (activated charcoal) which stays in
    // toxicology-emesis — that's why specific A07A/A07D/A07E, not bare A07.
    match: startsWithAtc('A07A', 'A07D', 'A07E', 'A07BB'),
  },
  {
    slug: 'reproductive',
    label: 'Reproductive & sex hormones · ระบบสืบพันธุ์และฮอร์โมนเพศ',
    subtitle: 'GnRH agonists, prostaglandins, progestins, gonadotropins, 5α-reductase — theriogenology',
    order: 240,
    // G02 gynecologicals (prostaglandins/oxytocics G02A + prolactin inhibitors
    // G02C like cabergoline), G03 sex hormones (progestins/estrogens/
    // gonadotropins), G04C BPH agents, H01CA gonadotropin-releasing hormones.
    // H01CA is disjoint from the H01B pituitary-hormones class (desmopressin/
    // oxytocin) which uses H01BA/H01BB.
    match: startsWithAtc('G02', 'G03', 'G04C', 'H01CA'),
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
