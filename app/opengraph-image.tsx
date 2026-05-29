// Site-level Open Graph image (PNG) — used when the bare domain or any
// route without an explicit opengraph-image.tsx is shared on social.
//
// Visual goal: editorial broadside w/ seal. The seal is approximated via
// nested round divs (ImageResponse doesn't render SVG so we can't drop in
// public/seal.svg directly — but a 3-ring CSS seal looks essentially
// identical at 360×360).

import { ImageResponse } from 'next/og'
import { DRUGS } from '@/lib/drugs'

export const alt = 'CUVETSMO Source — Verified Thai medical knowledge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const entries = DRUGS.length
  const signed = DRUGS.reduce((n, d) => n + d.signatures.length, 0)
  const citations = DRUGS.reduce((n, d) => n + d.citations.length, 0)

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#fbfaf7',
          padding: 56,
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        {/* Outer broadside frame */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            border: '2px solid #0a635a',
            opacity: 1,
            padding: 56,
            position: 'relative',
            alignItems: 'center',
            gap: 64,
          }}
        >
          {/* ── Left: CSS-drawn seal ── */}
          <div
            style={{
              display: 'flex',
              width: 360,
              height: 360,
              borderRadius: '50%',
              border: '4px solid #0a635a',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {/* Inner ring (double-stroke effect) */}
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: 14,
                left: 14,
                right: 14,
                bottom: 14,
                borderRadius: '50%',
                border: '1.5px solid #0a635a',
              }}
            />
            {/* 12 o'clock anchor */}
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: -8,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#0a635a',
              }}
            />
            {/* Hairline frame around S */}
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: 60,
                left: 60,
                right: 60,
                bottom: 60,
                borderRadius: '50%',
                border: '1px solid rgba(10, 99, 90, 0.35)',
              }}
            />
            {/* The S */}
            <div
              style={{
                display: 'flex',
                fontSize: 270,
                fontWeight: 700,
                color: '#0a635a',
                lineHeight: 1,
                marginTop: 24,
              }}
            >
              S
            </div>
            {/* Year stamp */}
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                bottom: 70,
                fontSize: 14,
                fontFamily: 'monospace',
                fontWeight: 600,
                letterSpacing: 4,
                color: 'rgba(10, 99, 90, 0.6)',
              }}
            >
              MMXXVI
            </div>
          </div>

          {/* ── Right: wordmark + tagline + colophon ── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              height: '100%',
              justifyContent: 'center',
            }}
          >
            {/* Eyebrow */}
            <div
              style={{
                display: 'flex',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 8,
                color: '#0a635a',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              CUVETSMO · SOURCE
            </div>

            {/* Display headline */}
            <div
              style={{
                display: 'flex',
                marginTop: 18,
                fontSize: 56,
                fontWeight: 700,
                letterSpacing: -1.2,
                color: '#053634',
                lineHeight: 1.05,
                flexWrap: 'wrap',
              }}
            >
              Verified Thai
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 56,
                fontWeight: 700,
                letterSpacing: -1.2,
                color: '#053634',
                lineHeight: 1.05,
              }}
            >
              medical knowledge.
            </div>

            {/* Thin rule */}
            <div
              style={{
                display: 'flex',
                marginTop: 26,
                height: 1,
                background: 'rgba(10, 99, 90, 0.4)',
              }}
            />

            {/* Tagline */}
            <div
              style={{
                display: 'flex',
                marginTop: 24,
                fontSize: 22,
                fontStyle: 'italic',
                color: '#3d362d',
                lineHeight: 1.35,
                flexWrap: 'wrap',
              }}
            >
              Every claim, citation, and signature verifies in your browser.
            </div>

            {/* Colophon stats */}
            <div
              style={{
                display: 'flex',
                marginTop: 36,
                fontSize: 16,
                fontFamily: 'monospace',
                letterSpacing: 3,
                color: '#3d362d',
              }}
            >
              {entries} ENTRIES · {citations} CITATIONS · {signed} SIGNATURE{signed === 1 ? '' : 'S'}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 8,
                fontSize: 16,
                fontFamily: 'monospace',
                letterSpacing: 3,
                color: '#0a635a',
                fontWeight: 700,
              }}
            >
              SOURCE.CUVETSMO.COM
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
