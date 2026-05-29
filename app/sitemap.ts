// app/sitemap.ts — auto-generated XML sitemap for search engines.
//
// Next 16 serves the array returned here as /sitemap.xml. Includes:
//   - Static pages (landing, /drugs list, /search, /verify, /about, etc.)
//   - All 43 drug entries (/drugs/<slug>)
//   - All therapeutic class pages (/drugs/class/<slug>)
//   - All verify pages (/verify/<slug>)
//   - All citation viewer pages (/c/<cid>)
//   - All credential pages (/credentials/<slug>)
//
// Priority + change frequency hints help crawlers focus on the highest-
// value pages. The drug entry pages get higher priority than citation
// viewers since the entries are the canonical reader-facing content.

import type { MetadataRoute } from 'next'
import { DRUGS } from '@/lib/drugs'
import { THERAPEUTIC_CLASSES } from '@/lib/classify'
import { listCredentials } from '@/lib/credentials'

const BASE = 'https://source.cuvetsmo.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,              lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/drugs`,         lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/about`,         lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/use-cases`,     lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/onboarding`,    lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/verify`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/trust`,         lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/log`,           lastModified: now, changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE}/health`,        lastModified: now, changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE}/changelog`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/assist`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/feedback`,      lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/privacy`,       lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/credentials`,   lastModified: now, changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE}/api`,           lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/sources`,       lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/search`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.5 },
  ]

  const drugPages: MetadataRoute.Sitemap = DRUGS.map(d => ({
    url: `${BASE}/drugs/${d.slug}`,
    lastModified: parseDateSafe(d.lastUpdated),
    changeFrequency: 'monthly' as const,
    priority: d.reviewedBy !== null ? 0.9 : 0.7,
  }))

  const classPages: MetadataRoute.Sitemap = THERAPEUTIC_CLASSES.map(c => ({
    url: `${BASE}/drugs/class/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const verifyPages: MetadataRoute.Sitemap = DRUGS.map(d => ({
    url: `${BASE}/verify/${d.slug}`,
    lastModified: parseDateSafe(d.lastUpdated),
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }))

  // Unique CIDs across all drugs (multiple drugs may cite same CID)
  const cidSet = new Set<string>()
  for (const d of DRUGS) {
    for (const c of d.citations) if (c.cid) cidSet.add(c.cid)
    for (const m of d.mirrorCIDs ?? []) cidSet.add(m.cid)
  }
  const citationPages: MetadataRoute.Sitemap = Array.from(cidSet).map(cid => ({
    url: `${BASE}/c/${cid}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.3,
  }))

  const credentialPages: MetadataRoute.Sitemap = listCredentials().map(c => ({
    url: `${BASE}/credentials/${c.slug}`,
    lastModified: parseDateSafe(c.credential.issuanceDate),
    changeFrequency: 'yearly' as const,
    priority: 0.5,
  }))

  return [
    ...staticPages,
    ...drugPages,
    ...classPages,
    ...verifyPages,
    ...credentialPages,
    ...citationPages,
  ]
}

function parseDateSafe(s: string | undefined): Date {
  if (!s) return new Date()
  const d = new Date(s)
  return Number.isFinite(d.getTime()) ? d : new Date()
}
