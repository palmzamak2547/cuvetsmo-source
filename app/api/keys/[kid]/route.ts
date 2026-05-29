// GET /api/keys/[kid] — public signing key as JSON Web Key.
//
// The verify UI calls this to fetch the key it needs for Web Crypto
// verification. External tools (signature-validation libraries) call
// it the same way. Free forever, cached at edge.

import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { parseAPIClaim, rateLimitHeaders, CORS_HEADERS_GET, errorResponse } from '@/lib/auth'

export const revalidate = 86400 // 1 day

export async function GET(request: Request, { params }: { params: Promise<{ kid: string }> }) {
  const claim = parseAPIClaim(request)
  const { kid } = await params

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(kid)) {
    return errorResponse(400, 'bad-kid', `Invalid key id "${kid}"`)
  }

  const filePath = path.join(process.cwd(), 'content', 'keys', `${kid}.pub.json`)
  if (!existsSync(filePath)) {
    return errorResponse(404, 'not-found', `No public key with kid "${kid}"`)
  }

  const raw = await readFile(filePath, 'utf8')
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw)
  } catch {
    return errorResponse(500, 'malformed-key', `Key file ${kid}.pub.json is malformed`)
  }

  return NextResponse.json(
    {
      apiVersion: '0.0.1',
      data: parsed,
    },
    {
      headers: {
        ...CORS_HEADERS_GET,
        ...rateLimitHeaders(claim),
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
      },
    },
  )
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS_GET })
}
