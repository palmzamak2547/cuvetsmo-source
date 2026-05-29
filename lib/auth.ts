// API tier + rate-limit model · Primitive 6.
//
// Inverted economics: public read is free forever. Institutional write
// and bulk dataset access are paid (Phase 1+). The Phase 0 surface ships
// the *shape* of this model — tier classification, rate-limit headers —
// but does NOT enforce limits yet. Enforcement lands in Phase 1 via
// Vercel KV / Upstash Redis once we have real traffic to throttle.
//
// Why headers without enforcement:
//   - API consumers can write code that respects the limits today
//   - When we flip enforcement on, no client breaks unexpectedly
//   - We can observe usage patterns before picking thresholds
//
// Public-read tier rate limits (when enforced):
//   - /api/drugs                  unlimited (cached at edge)
//   - /api/drugs/[slug]           unlimited (cached at edge)
//   - /api/by-code                1000 req/day per IP
//   - /api/keys/[kid]             unlimited (cached at edge)
//   - /api/log                    100 req/day per IP (large payload)
//   - /api/dataset                402 — institutional only
//
// Institutional tier (Phase 1):
//   - All read endpoints unlimited
//   - /api/dataset bulk export
//   - /api/contribute POST to queue PR
//   - Per-department revenue dashboard

export type Tier = 'public' | 'institutional' | 'admin'

export type APIClaim = {
  kid: string
  tier: Tier
  rateLimit: { rpd: number | null }  // null = unlimited
  institution?: string
}

export const ANONYMOUS_CLAIM: APIClaim = {
  kid: 'anonymous',
  tier: 'public',
  rateLimit: { rpd: 1000 },
}

/**
 * Parse the Authorization header into a claim. Phase 0 only knows the
 * anonymous claim — there are no issued keys yet. Future: look up
 * Bearer tokens against an institutional registry.
 */
export function parseAPIClaim(request: Request): APIClaim {
  const auth = request.headers.get('authorization')
  if (!auth) return ANONYMOUS_CLAIM
  // Phase 0: any Bearer token is treated as anonymous. Phase 1: validate.
  if (auth.startsWith('Bearer ')) return ANONYMOUS_CLAIM
  return ANONYMOUS_CLAIM
}

/**
 * Compose the rate-limit headers for a response. Always include these
 * even for unlimited tiers — consistent shape for clients.
 */
export function rateLimitHeaders(claim: APIClaim, costForThisCall = 1): Record<string, string> {
  const limit = claim.rateLimit.rpd
  return {
    'X-Source-Tier': claim.tier,
    'X-Source-Limit-RPD': limit === null ? 'unlimited' : String(limit),
    'X-Source-Cost': String(costForThisCall),
    'X-Source-Enforcement': 'phase-0-soft',  // changes to 'phase-1-enforced' later
  }
}

/**
 * Common CORS headers for public-read endpoints. Permissive on GET —
 * the whole point is that anyone can pull data. POST is locked.
 */
export const CORS_HEADERS_GET: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
}

/**
 * Standard error response shape — same fields whatever the error.
 */
export function errorResponse(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return Response.json(
    {
      ok: false,
      error: { code, message, ...extra },
      timestamp: new Date().toISOString(),
    },
    { status, headers: CORS_HEADERS_GET },
  )
}
