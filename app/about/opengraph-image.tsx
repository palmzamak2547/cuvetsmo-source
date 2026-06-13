// Per-page OG image for /about — the technology explainer.

import { ImageResponse } from 'next/og'

export const alt = 'CUVETSMO Source — How it works, and why we are the first'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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
          CUVETSMO · SOURCE · TECHNOLOGY EXPLAINER
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 38,
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: -2.5,
            color: '#053634',
            lineHeight: 1.02,
          }}
        >
          How it works
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 8,
            fontSize: 48,
            fontStyle: 'italic',
            color: '#3d362d',
          }}
        >
          & why we are the first.
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 36,
            height: 1,
            width: 460,
            background: 'rgba(10, 99, 90, 0.4)',
          }}
        />

        <div
          style={{
            display: 'flex',
            marginTop: 30,
            fontSize: 22,
            color: '#3d362d',
            fontStyle: 'italic',
            maxWidth: '88%',
          }}
        >
          8 primitives — explained for everyone. Cryptographic provenance.
          Content-addressed citations. AI-in-loop never authority.
        </div>

        <div style={{ display: 'flex', flexGrow: 1 }} />

        <div
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <Badge>8 PRIMITIVES</Badge>
          <Badge>11 CITED SOURCES</Badge>
          <Badge color="#053628" bg="#ecfdf5" border="#0a6347">0 PRIOR ART FOUND</Badge>
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
          SOURCE.CUVETSMO.COM/ABOUT
        </div>

        <div style={{ display: 'flex', height: 3, background: '#0a635a', opacity: 0.45, marginTop: 20 }} />
      </div>
    ),
    size,
  )
}

function Badge({
  children,
  color = '#0a635a',
  bg = '#effcf9',
  border = '#0a635a',
}: {
  children: React.ReactNode
  color?: string
  bg?: string
  border?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        padding: '12px 24px',
        border: `2px solid ${border}`,
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 20,
        fontWeight: 700,
        fontFamily: 'system-ui, sans-serif',
        letterSpacing: 2,
      }}
    >
      {children}
    </div>
  )
}
