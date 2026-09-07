import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { Newsreader, Inter } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegister from './ServiceWorkerRegister'
import CommandPaletteHost, { CommandPaletteTrigger } from './CommandPaletteHost'
import ThemeToggle from './ThemeToggle'

// Runs before first paint: stored choice wins, otherwise follow the OS.
// Keeps the dark palette from flashing light on load.
const THEME_BOOT = `try{var t=localStorage.getItem('cuvetsmo.theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}`
import { DRUGS } from '@/lib/drugs'

// Editorial serif for long-form prose surfaces (drug detail, sources,
// credentials). Optical sizing makes it gorgeous at every weight.
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

// UI sans for chrome (header, nav, badges, controls).
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const SITE_TITLE = 'CUVETSMO Source — Verified Thai Medical Knowledge'
const SITE_DESC = `คลังอ้างอิงยาสัตวแพทย์ภาษาไทย ${DRUGS.length} รายการ — ทุก dose ทุกข้อห้ามใช้ อ้างอิงแหล่ง authoritative อย่างน้อย 2 แหล่ง และตามรอยถึงต้นทางได้ทีละบรรทัด อ่านฟรี ใช้ผ่าน API และ MCP ได้`

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: '%s · CUVETSMO Source',
  },
  description: SITE_DESC,
  metadataBase: new URL('https://source.cuvetsmo.com'),
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'CUVETSMO Source',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    alternateLocale: ['en_US'],
    siteName: 'CUVETSMO Source',
    url: 'https://source.cuvetsmo.com',
    title: SITE_TITLE,
    description: SITE_DESC,
    // PNG from app/opengraph-image.tsx — LINE, Facebook, and X do not
    // render SVG previews, so pages without their own OG image inherit
    // the rendered PNG instead of the vector wordmark.
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'CUVETSMO Source — Verified Thai medical knowledge',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESC,
    images: ['/opengraph-image'],
  },
  authors: [{ name: 'Palm Anuthin Danoi (CUVETSMO 68)' }],
  creator: 'CUVETSMO',
  publisher: 'CUVETSMO',
  category: 'medical reference',
  keywords: [
    'thai veterinary medicine',
    'drug reference',
    'cryptographic verification',
    'citation-grade',
    'WHO ATC',
    'RxNorm',
    'WSAVA',
    'Ed25519',
    'verifiable credentials',
    'veterinary dosages',
    'ยาสัตวแพทย์',
  ],
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f766e' },
    { media: '(prefers-color-scheme: dark)', color: '#131110' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const sigCount = DRUGS.reduce((n, d) => n + d.signatures.length, 0)
  // Slim drug list passed to the global Cmd+K palette. Server → client prop.
  const paletteDrugs = DRUGS.map(d => ({
    slug: d.slug,
    nameEn: d.nameEn,
    nameTh: d.nameTh,
    class: d.class,
    atcCode: d.codes?.atc?.code ?? null,
    isCanonical: d.reviewedBy !== null && d.signatures.length > 0,
  }))
  return (
    <html lang="th" className={`${newsreader.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-source-800 focus:px-3 focus:py-2 focus:text-sm focus:text-paper-50"
        >
          Skip to content
        </a>
        <header className="border-b border-paper-200 bg-paper-50/85 backdrop-blur-sm sticky top-0 z-30">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5">
            <Link href="/" className="group flex items-center gap-3">
              <svg
                aria-hidden
                viewBox="0 0 64 64"
                className="h-9 w-9 shrink-0 rounded-[10px] shadow-sm ring-1 ring-source-900/15 transition group-hover:ring-source-900/30"
              >
                <defs>
                  <linearGradient id="hdrBg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0a635a"/>
                    <stop offset="100%" stopColor="#053634"/>
                  </linearGradient>
                </defs>
                <rect width="64" height="64" rx="14" fill="url(#hdrBg)"/>
                <text
                  x="32" y="48"
                  fontFamily="'Inter Tight', 'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif"
                  fontSize="44" fontWeight="900"
                  fill="#fbfaf7" textAnchor="middle"
                  letterSpacing="-2"
                >S</text>
                <circle cx="50" cy="14" r="3.2" fill="#FB923C"/>
                <circle cx="50" cy="14" r="1.6" fill="#FED7AA"/>
              </svg>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight text-ink-900">source</div>
                <div className="hidden text-[10px] uppercase tracking-[0.18em] text-ink-500 sm:block">CUVETSMO · verified vet knowledge</div>
              </div>
            </Link>
            <nav className="ml-auto flex items-center gap-x-5 gap-y-1 text-[13px] text-ink-700 flex-wrap justify-end">
              <CommandPaletteTrigger />
              <ThemeToggle />
              <Link href="/drugs"       className="hover:text-source-800">Drugs</Link>
              <Link href="/verify"      className="hidden hover:text-source-800 sm:inline">Verify</Link>
              <Link href="/about"       className="hidden hover:text-source-800 sm:inline">About</Link>
              <Link href="/use-cases"   className="hidden hover:text-source-800 lg:inline">Use cases</Link>
              <Link href="/api"         className="hidden hover:text-source-800 md:inline">API</Link>
              <Link href="/credentials" className="hidden hover:text-source-800 xl:inline">Credentials</Link>
              <a    href="https://cuvetsmo.com" className="hidden hover:text-source-800 xl:inline">cuvetsmo.com</a>
              {sigCount > 0 && (
                <span
                  className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-emerald-300/70 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-emerald-900"
                  title="At least one cryptographically signed entry"
                >
                  <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  {sigCount} signed
                </span>
              )}
            </nav>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-6xl px-5 py-12 md:py-16">{children}</main>
        <CommandPaletteHost drugs={paletteDrugs} />
        <ServiceWorkerRegister />

        <footer className="mt-24 border-t border-paper-200 bg-paper-100/70">
          <div className="mx-auto max-w-6xl px-5 py-10 text-xs text-ink-700">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-md">
                <p className="font-semibold tracking-tight text-ink-900">CUVETSMO Source</p>
                <p className="mt-2 leading-relaxed">
                  ส่วนหนึ่งของระบบนิเวศ CUVETSMO — คลังอ้างอิงยาสัตวแพทย์ที่ทุกข้อความอ้างอิงแหล่ง authoritative
                  อย่างน้อย 2 แหล่ง และตรวจสอบได้ที่แหล่งต้นทาง
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-[12px]">
                <Link href="/drugs"       className="hover:text-source-800">Drug Reference</Link>
                <Link href="/about"       className="hover:text-source-800">How it works</Link>
                <Link href="/use-cases"   className="hover:text-source-800">Use cases</Link>
                <Link href="/verify"      className="hover:text-source-800">Verify</Link>
                <Link href="/credentials" className="hover:text-source-800">Credentials</Link>
                <Link href="/api"         className="hover:text-source-800">Public API</Link>
                <Link href="/trust"       className="hover:text-source-800">Chain of trust</Link>
                <Link href="/log"         className="hover:text-source-800">Transparency log</Link>
                <Link href="/health"      className="hover:text-source-800">Citation health</Link>
                <Link href="/onboarding"  className="hover:text-source-800">Faculty onboarding</Link>
                <Link href="/changelog"   className="hover:text-source-800">Changelog</Link>
                <Link href="/assist"      className="hover:text-source-800">Translation assistant</Link>
                <Link href="/feedback"    className="hover:text-source-800">Feedback</Link>
                <Link href="/privacy"     className="hover:text-source-800">Privacy</Link>
                <Link href="/sources"     className="hover:text-source-800">Sources</Link>
                <a    href="https://github.com/palmzamak2547/cuvetsmo-source" className="hover:text-source-800">Source code</a>
              </div>
            </div>
            <p className="mt-8 border-t border-paper-200 pt-5 text-[11px] text-ink-500">
              Iron Rule 0 — no fabrication. Every clinical claim carries a citation you can follow to its
              source; an entry with an unsourced claim does not ship.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
