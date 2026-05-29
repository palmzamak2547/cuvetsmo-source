// app/robots.ts — robots.txt for search engine crawlers.
//
// Permissive by design: every page is fact-public, the more it gets
// indexed the better the editorial layer compounds. The OG and dynamic
// PNG routes are also open — they're the share-card thumbnails.

import type { MetadataRoute } from 'next'

const BASE = 'https://source.cuvetsmo.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block infrastructure paths from indexing — they contain
        // duplicate content and aren't useful as discovery surfaces.
        disallow: ['/api/', '/.well-known/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
