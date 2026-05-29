// GET /api/health — citation-probe health summary as JSON.
//
// Public read endpoint that returns the aggregate stats shown on /health.
// External consumers (status pages, monitoring, hospital integrators)
// can poll this to detect when citation rot exceeds a threshold.
//
// Tier: public-read, free, edge-cached for 5 minutes.

import { NextResponse } from 'next/server'
import { computeProbeStats } from '@/lib/probe-stats'
import { parseAPIClaim, rateLimitHeaders, CORS_HEADERS_GET } from '@/lib/auth'

export const revalidate = 300  // 5 minutes

export async function GET(request: Request) {
  const claim = parseAPIClaim(request)
  const stats = computeProbeStats()
  return NextResponse.json(
    {
      apiVersion: '0.0.1',
      generatedAt: new Date().toISOString(),
      summary: {
        totalCitations:   stats.total,
        probedCitations:  stats.probed,
        unprobedCount:    stats.unprobed,
        healthyCount:     stats.healthy,
        unhealthyCount:   stats.unhealthy,
        staleByDays:      stats.staleByDays,
        latestProbedAt:   stats.latestProbedAt,
        pctProbed:        stats.total > 0 ? Math.round((stats.probed / stats.total) * 100) : 0,
        pctHealthy:       stats.probed > 0 ? Math.round((stats.healthy / stats.probed) * 100) : 0,
      },
      bySource: stats.bySource,
      unhealthyEntries: stats.unhealthyEntries,
      docs: {
        humanReadable: 'https://source.cuvetsmo.com/health',
        explainer: 'https://source.cuvetsmo.com/about',
      },
    },
    {
      headers: {
        ...CORS_HEADERS_GET,
        ...rateLimitHeaders(claim),
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    },
  )
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS_GET })
}
