// GET /api/drugs — list ALL drug entries with their verificationTier.
//
// Every entry is reference-grade (◆ Sourced: cited + cross-checked across
// ≥2 authoritative sources). The verificationTier field (sourced | community
// | expert) lets consumers filter by trust level downstream. Mirror
// provenance + citations come along for source attribution + signature verify.
//
// Tier: public-read, free, cached at edge. See lib/auth.ts.

import { NextResponse } from 'next/server'
import { DRUGS, verificationTier } from '@/lib/drugs'
import { parseAPIClaim, rateLimitHeaders, CORS_HEADERS_GET } from '@/lib/auth'

export const revalidate = 3600 // 1 hour

export async function GET(request: Request) {
  const claim = parseAPIClaim(request)
  const drugs = DRUGS.map(d => ({ ...d, verificationTier: verificationTier(d) }))
  return NextResponse.json(
    {
      apiVersion: '0.1.0',
      lastUpdated: new Date().toISOString(),
      count: drugs.length,
      tierCounts: {
        sourced: DRUGS.filter(d => verificationTier(d) === 'sourced').length,
        community: DRUGS.filter(d => verificationTier(d) === 'community').length,
        expert: DRUGS.filter(d => verificationTier(d) === 'expert').length,
      },
      data: drugs,
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
