// GET /api/catalog — the FULL catalog in one request.
//
// One source of truth, many surfaces: this endpoint hands the entire
// ~269-drug catalog to any ecosystem consumer in a single pull, with
// EVERY field present (clinical sections, dosages, citations, ontology
// codes, mirror provenance) plus two derived conveniences:
//
//   - classSlug + classLabel  — the therapeutic class from classifyDrug()
//                               (same mapping /drugs browse pages use), so
//                               consumers can group without re-deriving it.
//   - verificationTier         — the same trust stamp /api/drugs exposes.
//
// Deterministic by design: the payload is a pure function of the on-disk
// content. No request-time timestamp is minted (each entry already carries
// its own `lastUpdated`), so identical content → byte-identical response,
// and the edge cache key stays stable.
//
// Tier: public-read, free, cached at edge. Mirrors the CORS + cache header
// shape of /api/drugs exactly. See lib/auth.ts.

import { NextResponse } from 'next/server'
import { DRUGS, verificationTier } from '@/lib/drugs'
import { classifyDrug } from '@/lib/classify'
import { parseAPIClaim, rateLimitHeaders, CORS_HEADERS_GET } from '@/lib/auth'

export const revalidate = 3600 // 1 hour

export async function GET(request: Request) {
  const claim = parseAPIClaim(request)
  const drugs = DRUGS.map(d => {
    const klass = classifyDrug(d)
    return {
      slug: d.slug,
      nameEn: d.nameEn,
      nameTh: d.nameTh,
      class: d.class,
      classSlug: klass?.slug ?? null,
      classLabel: klass?.label ?? null,
      mechanism: d.mechanism,
      brandNamesTh: d.brandNamesTh,
      indications: d.indications,
      contraindications: d.contraindications,
      sideEffects: d.sideEffects,
      dosages: d.dosages,
      interactions: d.interactions,
      monitoring: d.monitoring,
      citations: d.citations,
      codes: d.codes,
      mirroredFrom: d.mirroredFrom,
      verificationTier: verificationTier(d),
      version: d.version,
      lastUpdated: d.lastUpdated,
    }
  })
  return NextResponse.json(
    {
      count: drugs.length,
      drugs,
    },
    {
      headers: {
        ...CORS_HEADERS_GET,
        ...rateLimitHeaders(claim),
        'Cache-Control': 'public, max-age=600, s-maxage=3600',
      },
    },
  )
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS_GET })
}
