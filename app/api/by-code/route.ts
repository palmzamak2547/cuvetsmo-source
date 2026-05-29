// GET /api/by-code?system=atc&code=M01AC06
//
// Filter entries by ontology code. Returns the matching drugs.
//
// Supported systems: atc, rxnorm
// Phase 5 will add: snomed, loinc, icd11, vetspecial
//
// Tier: public-read with rate limits (Phase 0 = headers only).

import { NextResponse } from 'next/server'
import { DRUGS } from '@/lib/drugs'
import { parseAPIClaim, rateLimitHeaders, CORS_HEADERS_GET, errorResponse } from '@/lib/auth'

export const revalidate = 3600

export async function GET(request: Request) {
  const claim = parseAPIClaim(request)
  const url = new URL(request.url)
  const system = (url.searchParams.get('system') ?? '').toLowerCase()
  const code = (url.searchParams.get('code') ?? '').toUpperCase()

  if (!system || !code) {
    return errorResponse(400, 'missing-params', 'Both ?system and ?code are required', {
      example: '/api/by-code?system=atc&code=M01AC06',
      supportedSystems: ['atc', 'rxnorm'],
    })
  }

  let matches = DRUGS
  switch (system) {
    case 'atc':
      matches = DRUGS.filter(d => {
        const c = d.codes?.atc?.code?.toUpperCase()
        // Prefix match so M01A returns all NSAID descendants, M01AC06 returns just meloxicam
        return c === code || c?.startsWith(code)
      })
      break
    case 'rxnorm':
      matches = DRUGS.filter(d => d.codes?.rxnorm?.cui === code)
      break
    case 'snomed':
    case 'loinc':
    case 'icd11':
      return errorResponse(501, 'system-not-yet-supported',
        `Ontology system "${system}" is on the Phase 5 roadmap`, {
          phase0Supported: ['atc', 'rxnorm'],
        })
    default:
      return errorResponse(400, 'unknown-system',
        `Unknown ontology system "${system}"`, {
          supportedSystems: ['atc', 'rxnorm'],
        })
  }

  return NextResponse.json(
    {
      apiVersion: '0.0.1',
      query: { system, code },
      count: matches.length,
      data: matches.map(d => ({
        slug: d.slug,
        nameEn: d.nameEn,
        nameTh: d.nameTh,
        class: d.class,
        codes: d.codes,
      })),
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
