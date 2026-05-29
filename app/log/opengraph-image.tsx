// Per-page OG image for /log — transparency log.

import { ImageResponse } from 'next/og'
import { readLog } from '@/lib/log'

export const alt = 'CUVETSMO Source — Transparency log'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  const entries = readLog()
  const signerCount = new Set(entries.map(e => e.signerKeyId)).size
  const drugCount = new Set(entries.map(e => e.drugSlug)).size

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
          CUVETSMO · SOURCE · TRANSPARENCY LOG
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
          The audit trail.
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
          Every signing event, append-only, git-tracked, tamper-evident.
          The file&apos;s own git history is itself the audit trail.
        </div>

        <div style={{ display: 'flex', flexGrow: 1 }} />

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Tile label="ENTRIES" value={entries.length.toString()} />
          <Tile label="SIGNERS" value={signerCount.toString()} />
          <Tile label="DRUGS TOUCHED" value={drugCount.toString()} />
          <Tile label="APPEND-ONLY" value="JSONL" />
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
          SOURCE.CUVETSMO.COM/LOG
        </div>

        <div style={{ display: 'flex', height: 3, background: '#0a635a', opacity: 0.45, marginTop: 20 }} />
      </div>
    ),
    size,
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 22px',
        border: '2px solid #0a635a',
        borderRadius: 12,
        background: '#effcf9',
        minWidth: 150,
        alignItems: 'flex-start',
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 2,
          color: '#0a635a',
          fontFamily: 'system-ui, sans-serif',
          opacity: 0.75,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 38,
          fontWeight: 700,
          color: '#053634',
          fontFamily: 'Georgia, serif',
          lineHeight: 1,
          marginTop: 4,
        }}
      >
        {value}
      </span>
    </div>
  )
}
