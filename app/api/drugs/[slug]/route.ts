// GET /api/drugs/[slug] — single drug entry as JSON.
//
// Tier: public-read, free, cached at edge.

import { NextResponse } from 'next/server'
import { findDrug, DRUGS } from '@/lib/drugs'
import { parseAPIClaim, rateLimitHeaders, CORS_HEADERS_GET, errorResponse } from '@/lib/auth'

export const revalidate = 3600 // 1 hour

export async function generateStaticParams() {
  return DRUGS.map(d => ({ slug: d.slug }))
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const claim = parseAPIClaim(request)
  const { slug } = await params
  const drug = findDrug(slug)
  if (!drug) {
    return errorResponse(404, 'not-found', `No drug with slug "${slug}"`)
  }
  return NextResponse.json(
    {
      apiVersion: '0.0.1',
      lastUpdated: new Date().toISOString(),
      data: drug,
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
