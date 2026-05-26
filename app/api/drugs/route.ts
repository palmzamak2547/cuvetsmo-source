// JSON endpoint for the drug dataset. Returns published entries only —
// pending/template entries are filtered out so consumers of this API
// can rely on faculty-reviewed content. The mirror provenance + citation
// list comes along so downstream tooling can show source attribution.

import { NextResponse } from 'next/server'
import { publishedDrugs } from '@/lib/drugs'

export const revalidate = 3600 // 1 hour

export async function GET() {
  return NextResponse.json(
    {
      apiVersion: '0.0.1',
      lastUpdated: new Date().toISOString(),
      count: publishedDrugs().length,
      data: publishedDrugs(),
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=3600',
      },
    }
  )
}
