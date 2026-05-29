// GET /api/drugs — list all canonical (faculty-reviewed AND signed) drugs.
//
// Pending/template entries are filtered out — consumers of this API can
// rely on faculty-reviewed content. Mirror provenance + citations come
// along so downstream tooling can show source attribution and verify
// signatures.
//
// Tier: public-read, free, cached at edge. See lib/auth.ts.

import { NextResponse } from 'next/server'
import { publishedDrugs } from '@/lib/drugs'
import { parseAPIClaim, rateLimitHeaders, CORS_HEADERS_GET } from '@/lib/auth'

export const revalidate = 3600 // 1 hour

export async function GET(request: Request) {
  const claim = parseAPIClaim(request)
  const drugs = publishedDrugs()
  return NextResponse.json(
    {
      apiVersion: '0.0.1',
      lastUpdated: new Date().toISOString(),
      count: drugs.length,
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
