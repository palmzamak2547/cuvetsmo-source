// GET /api/log — transparency log of all signature events.
//
// Returns each line of content/log/transparency-log.jsonl parsed as
// JSON, plus a summary. This is the append-only audit trail of every
// time something was signed — readers can scan for unexpected signing
// activity, dataset researchers can cite the log seq numbers.
//
// Cache: 1 hour. Log grows but slowly; refresh hourly is fine.

import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { parseAPIClaim, rateLimitHeaders, CORS_HEADERS_GET, errorResponse } from '@/lib/auth'

export const revalidate = 3600

export async function GET(request: Request) {
  const claim = parseAPIClaim(request)
  const logPath = path.join(process.cwd(), 'content', 'log', 'transparency-log.jsonl')

  if (!existsSync(logPath)) {
    return NextResponse.json(
      {
        apiVersion: '0.0.1',
        count: 0,
        entries: [],
        note: 'Transparency log is empty — no entries have been signed yet.',
      },
      {
        headers: {
          ...CORS_HEADERS_GET,
          ...rateLimitHeaders(claim),
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      },
    )
  }

  const raw = await readFile(logPath, 'utf8')
  const entries: unknown[] = []
  const parseErrors: string[] = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      entries.push(JSON.parse(trimmed))
    } catch {
      parseErrors.push(trimmed.slice(0, 80))
    }
  }

  if (parseErrors.length > 0) {
    return errorResponse(500, 'log-corrupt', 'Transparency log has unparseable entries', {
      parseErrorSamples: parseErrors.slice(0, 3),
    })
  }

  return NextResponse.json(
    {
      apiVersion: '0.0.1',
      count: entries.length,
      entries,
    },
    {
      headers: {
        ...CORS_HEADERS_GET,
        ...rateLimitHeaders(claim, 5),  // 5x cost — log is heavier
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    },
  )
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS_GET })
}
