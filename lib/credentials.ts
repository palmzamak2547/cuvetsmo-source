// Server-side helpers for loading + listing Verifiable Credentials.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { VerifiableCredential } from './vc'

const CREDS_DIR = path.join(process.cwd(), 'content', 'credentials')

export type IndexedCredential = {
  slug: string  // filename stem, e.g. "board-root"
  filename: string
  credential: VerifiableCredential
}

export function listCredentials(): IndexedCredential[] {
  if (!existsSync(CREDS_DIR)) return []
  const files = readdirSync(CREDS_DIR).filter(f => f.endsWith('.vc.json'))
  return files.map(f => {
    const filePath = path.join(CREDS_DIR, f)
    const data = JSON.parse(readFileSync(filePath, 'utf8')) as VerifiableCredential
    return {
      slug: f.replace(/\.vc\.json$/, ''),
      filename: f,
      credential: data,
    }
  })
}

export function findCredential(slug: string): IndexedCredential | undefined {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return undefined
  return listCredentials().find(c => c.slug === slug)
}
