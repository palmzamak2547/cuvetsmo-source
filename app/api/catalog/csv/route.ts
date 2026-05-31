// GET /api/catalog/csv — the FULL catalog as a flat CSV.
//
// One row per (drug × dosage), so a spreadsheet or BI tool can pivot on
// species / route / indication without unpacking nested JSON. A drug with
// an EMPTY dosages array still emits one row (blank dose columns) so no
// entry is ever silently dropped from the export.
//
// Columns:
//   slug,nameEn,nameTh,classSlug,atc,rxcui,species,indication,route,dose,citationCount
//
//   - classSlug      therapeutic class slug from classifyDrug() (or blank)
//   - atc            codes.atc.code     (or blank)
//   - rxcui          codes.rxnorm.cui   (or blank)
//   - citationCount  on a dosage row: that dosage's cite count; on the
//                    blank-dosage fallback row: the drug's total citation
//                    count (so the row still carries a meaningful number).
//
// RFC 4180 escaping: any field containing a comma, double-quote, CR or LF
// is wrapped in double-quotes with internal quotes doubled. Thai names and
// dose strings routinely contain commas, so this is load-bearing.
//
// Deterministic by design: pure function of on-disk content, no request-time
// timestamp. Mirrors the CORS + cache header shape of /api/drugs. See
// lib/auth.ts.

import { DRUGS } from '@/lib/drugs'
import { classifyDrug } from '@/lib/classify'
import { parseAPIClaim, rateLimitHeaders, CORS_HEADERS_GET } from '@/lib/auth'

export const revalidate = 3600 // 1 hour

const COLUMNS = [
  'slug',
  'nameEn',
  'nameTh',
  'classSlug',
  'atc',
  'rxcui',
  'species',
  'indication',
  'route',
  'dose',
  'citationCount',
] as const

/**
 * RFC 4180 field escaping. Wrap in double-quotes (and double any internal
 * double-quote) iff the field contains a comma, double-quote, CR or LF.
 */
function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"'
  }
  return value
}

function csvRow(fields: string[]): string {
  return fields.map(csvEscape).join(',')
}

export async function GET(request: Request) {
  const claim = parseAPIClaim(request)

  const lines: string[] = [csvRow([...COLUMNS])]

  for (const d of DRUGS) {
    const classSlug = classifyDrug(d)?.slug ?? ''
    const atc = d.codes?.atc?.code ?? ''
    const rxcui = d.codes?.rxnorm?.cui ?? ''

    if (d.dosages.length === 0) {
      // No dosage rows — emit one row with blank dose columns so the drug
      // is still represented. citationCount = drug's total citations.
      lines.push(
        csvRow([
          d.slug,
          d.nameEn,
          d.nameTh,
          classSlug,
          atc,
          rxcui,
          '', // species
          '', // indication
          '', // route
          '', // dose
          String(d.citations.length),
        ]),
      )
      continue
    }

    for (const dose of d.dosages) {
      lines.push(
        csvRow([
          d.slug,
          d.nameEn,
          d.nameTh,
          classSlug,
          atc,
          rxcui,
          dose.species,
          dose.indication,
          dose.route,
          dose.dose,
          String(dose.cites.length),
        ]),
      )
    }
  }

  // RFC 4180 uses CRLF line breaks; trailing newline for POSIX-tool friendliness.
  const body = lines.join('\r\n') + '\r\n'

  return new Response(body, {
    headers: {
      ...CORS_HEADERS_GET,
      ...rateLimitHeaders(claim),
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="cuvetsmo-source-catalog.csv"',
      'Cache-Control': 'public, max-age=600, s-maxage=3600',
    },
  })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS_GET })
}
