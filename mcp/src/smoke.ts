// Smoke test for the cuvetsmo-source MCP data layer.
// Runs the tool logic directly (no transport) to confirm the data plane works
// AND guards against class-list drift vs the website's lib/classify.ts:
// if a drug classifies to no class here, that's a signal the CLASS_RULES need
// updating to match lib/classify.ts. Run: npm run build && npm run smoke.

import {
  DRUGS, ATC, findBySlug, findByAtc, searchDrugs, verifyCitation,
  classifyDrug, verificationTier, summarize,
} from './data.js'

let fail = 0
const check = (label: string, cond: boolean, detail = '') => {
  console.log(`${cond ? '✓' : '✗'} ${label}${detail ? ' — ' + detail : ''}`)
  if (!cond) fail++
}

check('loads drugs', DRUGS.length > 100, `${DRUGS.length} drugs`)
check('loads ATC ontology', Object.keys(ATC).length > 300, `${Object.keys(ATC).length} codes`)

const mel = findBySlug('meloxicam')
check('get_drug meloxicam', !!mel && mel.nameEn === 'Meloxicam')
check('meloxicam is verified tier', !!mel && verificationTier(mel) === 'verified')

const search = searchDrugs('NSAID', 20)
check('search_drugs NSAID returns hits', search.length > 0, `${search.length} hits`)
check('search by ATC code', searchDrugs('M01AC06').length > 0)

const j01 = findByAtc('J01')
check('get_by_code ATC prefix J01 (antibiotics)', j01.length >= 8, `${j01.length} drugs`)

const vc = verifyCitation('meloxicam', mel?.citations[0]?.id ?? 'x')
check('verify_citation resolves real id', vc.found === true)
const vbad = verifyCitation('meloxicam', 'definitely-not-real')
check('verify_citation rejects fake id', vbad.found === false)

// Drift guard: every drug must classify to a class. An unclassified drug means
// CLASS_RULES here is out of sync with lib/classify.ts (new class added on web,
// not mirrored in MCP).
const unclassified = DRUGS.filter(d => !classifyDrug(d)).map(d => `${d.slug} (${d.codes?.atc?.code})`)
check('all drugs classify (no drift vs lib/classify.ts)', unclassified.length === 0,
  unclassified.length ? `UNCLASSIFIED: ${unclassified.join(', ')}` : 'all mapped')

// summarize shape
const s = mel ? summarize(mel) : null
check('summarize has source URL', !!s && s.url.startsWith('https://source.cuvetsmo.com/drugs/'))

console.log('')
if (fail === 0) { console.log(`SMOKE PASS — data plane healthy (${DRUGS.length} drugs)`); process.exit(0) }
else { console.log(`SMOKE FAIL — ${fail} check(s) failed`); process.exit(1) }
