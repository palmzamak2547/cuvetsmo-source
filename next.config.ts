import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  // Production builds — no source maps to ship (same hardening as
  // webcuvetsmo: keep the citation-grade reference site closed-source-
  // at-runtime even though the repo itself is public).
  productionBrowserSourceMaps: false,
  // Pin Turbopack to this project root so it ignores the parent
  // C:\Users\palmz\package-lock.json (Palm has a homedir lockfile that
  // otherwise confuses workspace-root detection). process.cwd() works
  // here because Next always invokes the config from the project root.
  turbopack: {
    root: process.cwd(),
  },
  // Baseline hardening headers. No CSP: a nonce would force every page
  // dynamic (this site is fully static) and a nonce-less CSP would need
  // 'unsafe-inline' anyway — net zero. These four are free.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default config
