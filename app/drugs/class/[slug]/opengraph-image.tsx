// Per-class Open Graph image.
//
// When /drugs/class/<slug> is shared, the preview shows the class name
// in big serif + entry count + Thai subtitle + the cross-checked badge.

import { ImageResponse } from 'next/og'
import { DRUGS } from '@/lib/drugs'
import { findClassBySlug, classifyDrug } from '@/lib/classify'

export const alt = 'CUVETSMO Source — therapeutic class browse'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const klass = findClassBySlug(slug)
  if (!klass) {
    return new ImageResponse(<div style={{ display: 'flex' }}>Class not found</div>, size)
  }
  const entries = DRUGS.filter(d => classifyDrug(d)?.slug === klass.slug)
  const canonical = entries.filter(e => e.reviewedBy !== null && e.signatures.length > 0).length

  const labelEn = klass.label.split('·')[0].trim()
  const labelTh = klass.label.includes('·') ? klass.label.split('·')[1].trim() : ''

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
          CUVETSMO · SOURCE · THERAPEUTIC CLASS
        </div>

        {/* Big class name */}
        <div
          style={{
            display: 'flex',
            marginTop: 40,
            fontSize: 110,
            fontWeight: 700,
            letterSpacing: -2.5,
            color: '#053634',
            lineHeight: 1.02,
            flexWrap: 'wrap',
          }}
        >
          {labelEn}
        </div>
        {labelTh && (
          <div
            style={{
              display: 'flex',
              marginTop: 8,
              fontSize: 38,
              fontStyle: 'italic',
              color: '#3d362d',
            }}
          >
            {labelTh}
          </div>
        )}

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            marginTop: 36,
            fontSize: 24,
            color: '#3d362d',
            fontStyle: 'italic',
            maxWidth: '88%',
          }}
        >
          {klass.subtitle}
        </div>

        {/* Spacer */}
        <div style={{ display: 'flex', flexGrow: 1 }} />

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              padding: '12px 26px',
              border: '2.5px solid #0a635a',
              borderRadius: 999,
              background: '#effcf9',
              color: '#0a635a',
              fontSize: 24,
              fontWeight: 700,
              fontFamily: 'system-ui, sans-serif',
              letterSpacing: 2,
            }}
          >
            {entries.length} {entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
          </div>
          {canonical > 0 && (
            <div
              style={{
                display: 'flex',
                padding: '12px 24px',
                border: '2px solid #0a6347',
                borderRadius: 999,
                background: '#ecfdf5',
                color: '#053628',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 2,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {canonical} CANONICAL
            </div>
          )}
          {entries.length - canonical > 0 && (
            <div
              style={{
                display: 'flex',
                padding: '12px 24px',
                border: '2px solid #a87c1e',
                borderRadius: 999,
                background: '#fffbeb',
                color: '#5c4108',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 2,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              ⏳ {entries.length - canonical} PENDING
            </div>
          )}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            display: 'flex',
            marginTop: 24,
            fontSize: 18,
            fontFamily: 'monospace',
            color: '#053634',
            letterSpacing: 3,
            fontWeight: 700,
          }}
        >
          SOURCE.CUVETSMO.COM/DRUGS/CLASS/{klass.slug.toUpperCase()}
        </div>

        <div style={{ display: 'flex', height: 3, background: '#0a635a', opacity: 0.45, marginTop: 20 }} />
      </div>
    ),
    size,
  )
}
