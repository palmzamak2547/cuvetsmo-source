// Per-drug Open Graph image (PNG, dynamically generated).
//
// When someone shares /drugs/<slug> on Twitter / Line / Discord, the
// preview card shows this image — drug name in big serif, ATC + RxNorm
// chips, status badge. Auto-generated at request time via Next 16's
// ImageResponse API.
//
// ImageResponse constraints:
//   - Every element must declare a flex layout (no normal block flow).
//   - System fonts only (no Google Fonts unless fetched + passed as ArrayBuffer).
//   - No inline SVG; raster image tags work but add latency.
//   - Non-emoji symbols (U+2713, U+25C6) trigger a failed dynamic font
//     fetch at build time — keep the copy to letters, digits, and emoji.
//
// We use system serif (Georgia fallback) for the editorial typography.

import { ImageResponse } from 'next/og'
import { findDrug, verificationTier } from '@/lib/drugs'

export const alt = 'CUVETSMO Source — drug reference preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const drug = findDrug(slug)

  // 404 fallback — render a generic "not found" card.
  if (!drug) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            background: '#fbfaf7',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Georgia, serif',
            fontSize: 64,
            color: '#053634',
          }}
        >
          Entry not found · source.cuvetsmo.com
        </div>
      ),
      size,
    )
  }

  // Tier-aware, same ladder as the page. Every entry is at least "Verified"
  // (cited + cross-checked); the expert rung only shows once an entry has a
  // named reviewer + signature. Never a "pending / do not use" card.
  const isExpert = verificationTier(drug) === 'expert'
  const citeCount = drug.citations.length
  const doseCount = drug.dosages.length

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
        {/* Top hairline */}
        <div style={{ display: 'flex', height: 3, background: '#0a635a', opacity: 0.45 }} />

        {/* Eyebrow */}
        <div
          style={{
            display: 'flex',
            marginTop: 22,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 7,
            color: '#0a635a',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          CUVETSMO · SOURCE · VERIFIED MEDICAL KNOWLEDGE
        </div>

        {/* Drug name (English) */}
        <div
          style={{
            display: 'flex',
            marginTop: 36,
            fontSize: 110,
            fontWeight: 700,
            letterSpacing: -2.5,
            color: '#053634',
            lineHeight: 1.02,
          }}
        >
          {drug.nameEn}
        </div>

        {/* Drug name (Thai, italic) */}
        <div
          style={{
            display: 'flex',
            marginTop: 6,
            fontSize: 46,
            fontStyle: 'italic',
            color: '#3d362d',
          }}
        >
          {drug.nameTh}
        </div>

        {/* Class */}
        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 24,
            color: '#3d362d',
            maxWidth: '90%',
          }}
        >
          {drug.class}
        </div>

        {/* Ontology code chips */}
        <div style={{ display: 'flex', marginTop: 28, gap: 14 }}>
          {drug.codes?.atc && (
            <div
              style={{
                display: 'flex',
                padding: '10px 22px',
                border: '2px solid #0a635a',
                borderRadius: 999,
                fontFamily: 'monospace',
                fontSize: 22,
                fontWeight: 700,
                color: '#0a635a',
                background: '#effcf9',
              }}
            >
              ATC {drug.codes.atc.code}
            </div>
          )}
          {drug.codes?.rxnorm && (
            <div
              style={{
                display: 'flex',
                padding: '10px 22px',
                border: '2px solid #0a635a',
                borderRadius: 999,
                fontFamily: 'monospace',
                fontSize: 22,
                fontWeight: 700,
                color: '#0a635a',
                background: '#effcf9',
              }}
            >
              RxNorm {drug.codes.rxnorm.cui}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ display: 'flex', flexGrow: 1 }} />

        {/* Provenance line */}
        <div
          style={{
            display: 'flex',
            fontSize: 18,
            fontFamily: 'monospace',
            color: '#3d362d',
            letterSpacing: 2,
          }}
        >
          {citeCount} CITED SOURCE{citeCount === 1 ? '' : 'S'} · {doseCount} SPECIES-SPECIFIC DOSE{doseCount === 1 ? '' : 'S'}
        </div>

        {/* Bottom row: status + URL */}
        <div
          style={{
            display: 'flex',
            marginTop: 18,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              padding: '10px 26px',
              border: `2.5px solid ${isExpert ? '#0a6347' : '#0a635a'}`,
              borderRadius: 999,
              background: isExpert ? '#ecfdf5' : '#effcf9',
              color: isExpert ? '#053628' : '#053634',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 3,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {isExpert
              ? 'EXPERT-REVIEWED — FACULTY-ENDORSED'
              : 'VERIFIED — CITED + CROSS-CHECKED'}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 18,
              fontFamily: 'monospace',
              color: '#053634',
              letterSpacing: 3,
              fontWeight: 700,
            }}
          >
            SOURCE.CUVETSMO.COM/DRUGS/{drug.slug}
          </div>
        </div>

        {/* Bottom hairline */}
        <div style={{ display: 'flex', height: 3, background: '#0a635a', opacity: 0.45, marginTop: 18 }} />
      </div>
    ),
    size,
  )
}
