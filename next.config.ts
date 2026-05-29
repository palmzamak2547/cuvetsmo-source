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
}

export default config
