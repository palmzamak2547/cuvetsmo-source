import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  // Production builds — no source maps to ship (same hardening as
  // webcuvetsmo: keep the citation-grade reference site closed-source-
  // at-runtime even though the repo itself is public).
  productionBrowserSourceMaps: false,
}

export default config
