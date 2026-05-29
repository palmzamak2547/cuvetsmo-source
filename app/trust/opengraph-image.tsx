// Per-page OG image for /trust — chain of trust visualization.

import { ImageResponse } from 'next/og'
import { DRUGS } from '@/lib/drugs'
import { listCredentials } from '@/lib/credentials'
import { readdirSync, existsSync } from 'node:fs'
import path from 'node:path'

export const alt = 'CUVETSMO Source — Chain of trust'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function countKeys() {
  const dir = path.join(process.cwd(), 'content', 'keys')
  if (!existsSync(dir)) return 0
  return readdirSync(dir).filter(f => f.endsWith('.pub.json')).length
}

export default function Image() {
  const keys = countKeys()
  const credentials = listCredentials().length
  const signed = DRUGS.filter(d => d.signatures.length > 0).length
  const sigCount = DRUGS.reduce((n, d) => n + d.signatures.length, 0)

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#fbfaf7',
          padding: 64,
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        <div style={{ display: 'flex', height: 3, background: '#0a635a', opacity: 0.45 }} />

        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 8,
            color: '#0a635a',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          CUVETSMO · SOURCE · PROVENANCE HIERARCHY
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 40,
            fontSize: 110,
            fontWeight: 700,
            letterSpacing: -2.5,
            color: '#053634',
            lineHeight: 1.02,
          }}
        >
          Chain of trust.
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 32,
            fontSize: 24,
            fontStyle: 'italic',
            color: '#3d362d',
            maxWidth: '88%',
          }}
        >
          DID → signing keys → credentials + signed entries.
          The full cryptographic dependency tree, in one page.
        </div>

        <div style={{ display: 'flex', flexGrow: 1 }} />

        {/* Tree summary */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 18,
            border: '1.5px solid rgba(10, 99, 90, 0.25)',
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.6)',
            fontFamily: 'monospace',
            fontSize: 18,
            color: '#053634',
          }}
        >
          <div style={{ display: 'flex' }}>🏛  did:web:source.cuvetsmo.com  (platform root)</div>
          <div style={{ display: 'flex', paddingLeft: 28 }}>└── 🗝  {keys} signing key{keys === 1 ? '' : 's'}</div>
          <div style={{ display: 'flex', paddingLeft: 56 }}>├── 📜 {credentials} W3C credential{credentials === 1 ? '' : 's'}</div>
          <div style={{ display: 'flex', paddingLeft: 56 }}>└── 🔏 {signed} signed entr{signed === 1 ? 'y' : 'ies'} · {sigCount} signature{sigCount === 1 ? '' : 's'}</div>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 22,
            fontSize: 18,
            fontFamily: 'monospace',
            color: '#053634',
            letterSpacing: 3,
            fontWeight: 700,
          }}
        >
          SOURCE.CUVETSMO.COM/TRUST
        </div>

        <div style={{ display: 'flex', height: 3, background: '#0a635a', opacity: 0.45, marginTop: 20 }} />
      </div>
    ),
    size,
  )
}
