// Transparency-log reader.
//
// content/log/transparency-log.jsonl is an append-only audit trail of
// every signing event. Each line is a JSON record produced by
// scripts/sign.mjs. The file is committed to git, so its history is
// itself tamper-evident.

import { existsSync, readFileSync } from 'fs'
import path from 'path'

export type LogEntry = {
  entryType: 'drug-signature'
  drugSlug: string
  drugVersion: number
  signerId: string
  signerName: string
  signerKeyId: string
  contentHash: string
  signature: string
  signedAt: string  // ISO 8601
  logSeq: number
}

const LOG_PATH = path.join(process.cwd(), 'content', 'log', 'transparency-log.jsonl')

export function readLog(): LogEntry[] {
  if (!existsSync(LOG_PATH)) return []
  const raw = readFileSync(LOG_PATH, 'utf8')
  const entries: LogEntry[] = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      entries.push(JSON.parse(trimmed) as LogEntry)
    } catch {
      // Skip malformed lines; the verify-content lint catches these.
    }
  }
  return entries
}

/** Latest N entries, newest first. */
export function readLogLatest(n: number): LogEntry[] {
  return readLog().slice().sort((a, b) => b.logSeq - a.logSeq).slice(0, n)
}

/** Group log entries by signer for the chain-of-trust visualization. */
export function groupBySigner(entries: LogEntry[]): Map<string, LogEntry[]> {
  const byKey = new Map<string, LogEntry[]>()
  for (const e of entries) {
    const arr = byKey.get(e.signerKeyId) ?? []
    arr.push(e)
    byKey.set(e.signerKeyId, arr)
  }
  return byKey
}
