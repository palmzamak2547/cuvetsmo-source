// GET /api/dataset — institutional bulk export (Phase 1+).
//
// Phase 0: returns 402 Payment Required + a structured payload pointing
// at the contact channel. Inverted economics — public read is free, but
// bulk extraction and institutional integration require a tier.
//
// The point of shipping 402 today rather than 404 is to communicate the
// shape of the future API to consumers writing integrations now.

import { CORS_HEADERS_GET } from '@/lib/auth'

export const revalidate = 86400

export async function GET() {
  return Response.json(
    {
      ok: false,
      error: {
        code: 'institutional-tier-required',
        message: 'Bulk dataset export requires an institutional API key. Public-read tier is free at /api/drugs and /api/by-code.',
      },
      contact: {
        email: 'palm@cuvetsmo.com',
        subject: 'Institutional API access — <your institution>',
        included: [
          'Bulk JSON export of all canonical entries',
          'Per-month delta feeds',
          'DOI minting for cited datasets',
          'Per-department revenue share for contributing faculty',
        ],
      },
      phase0Alternatives: {
        publicRead: 'https://source.cuvetsmo.com/api/drugs',
        byCode: 'https://source.cuvetsmo.com/api/by-code?system=atc&code=M01AC06',
        singleEntry: 'https://source.cuvetsmo.com/api/drugs/<slug>',
        publicKeys: 'https://source.cuvetsmo.com/api/keys/<kid>',
        transparencyLog: 'https://source.cuvetsmo.com/api/log',
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: 402,
      headers: {
        ...CORS_HEADERS_GET,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    },
  )
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS_GET })
}
