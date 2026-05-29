// Citation-probe aggregator — reads every citation file and computes
// upstream-health statistics. Used by /health and the citation-health
// summary panels.

import { existsSync, readdirSync, readFileSync } from 'fs'
import path from 'path'
import type { CitationFile, ProbeRecord } from './cid'

const CITATIONS_DIR = path.join(process.cwd(), 'content', 'citations')

export type ProbeStats = {
  total: number              // total citations on disk
  probed: number             // have at least one probe
  unprobed: number           // never probed
  healthy: number            // latest probe HTTP 2xx/3xx
  unhealthy: number          // latest probe HTTP 4xx/5xx or error
  staleByDays: number        // probed but not within 30 days
  latestProbedAt: string | null
  unhealthyEntries: Array<{
    cid: string
    sourceId: string
    url: string
    latestStatus: number
    latestProbedAt: string
    error?: string
  }>
  bySource: Record<string, { total: number; healthy: number; unhealthy: number }>
}

const STALE_THRESHOLD_DAYS = 30

function loadAllCitations(): CitationFile[] {
  if (!existsSync(CITATIONS_DIR)) return []
  const files = readdirSync(CITATIONS_DIR).filter(f => f.endsWith('.json'))
  return files.map(f => JSON.parse(readFileSync(path.join(CITATIONS_DIR, f), 'utf8')) as CitationFile)
}

function latestProbe(probes: ProbeRecord[] | undefined): ProbeRecord | null {
  if (!probes || probes.length === 0) return null
  return probes.slice().sort((a, b) => Date.parse(b.probedAt) - Date.parse(a.probedAt))[0]
}

export function computeProbeStats(): ProbeStats {
  const citations = loadAllCitations()
  const now = Date.now()
  const staleMs = STALE_THRESHOLD_DAYS * 86_400_000

  let probed = 0
  let healthy = 0
  let unhealthy = 0
  let staleByDays = 0
  let latestOverall = 0
  const unhealthyEntries: ProbeStats['unhealthyEntries'] = []
  const bySource: ProbeStats['bySource'] = {}

  for (const c of citations) {
    const src = c.canonical.sourceId
    if (!bySource[src]) bySource[src] = { total: 0, healthy: 0, unhealthy: 0 }
    bySource[src].total++

    const last = latestProbe(c.probes)
    if (!last) continue

    probed++
    const probedAt = Date.parse(last.probedAt)
    if (Number.isFinite(probedAt)) {
      if (probedAt > latestOverall) latestOverall = probedAt
      if (now - probedAt > staleMs) staleByDays++
    }
    const ok = last.httpStatus >= 200 && last.httpStatus < 400
    if (ok) {
      healthy++
      bySource[src].healthy++
    } else {
      unhealthy++
      bySource[src].unhealthy++
      unhealthyEntries.push({
        cid: c.cid,
        sourceId: src,
        url: c.canonical.url,
        latestStatus: last.httpStatus,
        latestProbedAt: last.probedAt,
        error: last.error,
      })
    }
  }

  return {
    total: citations.length,
    probed,
    unprobed: citations.length - probed,
    healthy,
    unhealthy,
    staleByDays,
    latestProbedAt: latestOverall > 0 ? new Date(latestOverall).toISOString() : null,
    unhealthyEntries,
    bySource,
  }
}
