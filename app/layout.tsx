import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'CUVETSMO Source — Verified Thai Medical Knowledge',
    template: '%s · CUVETSMO Source',
  },
  description:
    'แหล่งอ้างอิงทางการแพทย์และวิทยาศาสตร์ชีวภาพภาษาไทย ที่ทุกข้อมูลมี citation จาก peer-reviewed source และอาจารย์ผู้เชี่ยวชาญตรวจรับ — ต่อต้านยุค AI hallucination ด้วย provenance-first design',
  metadataBase: new URL('https://source.cuvetsmo.com'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <header className="border-b border-paper-200 bg-paper-50/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="group flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-source-700 text-xs font-bold text-white">S</span>
              <div className="leading-tight">
                <div className="text-sm font-bold text-paper-900">CUVETSMO Source</div>
                <div className="text-[10px] uppercase tracking-wider text-paper-700">Verified Thai medical knowledge</div>
              </div>
            </Link>
            <nav className="flex items-center gap-5 text-sm text-paper-700">
              <Link href="/drugs" className="hover:text-source-700">Drugs</Link>
              <Link href="/sources" className="hover:text-source-700">Sources</Link>
              <a href="https://cuvetsmo.com" className="hover:text-source-700">cuvetsmo.com</a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>

        <footer className="mt-16 border-t border-paper-200 bg-paper-100">
          <div className="mx-auto max-w-5xl px-4 py-8 text-xs text-paper-700">
            <p className="font-semibold text-paper-900">CUVETSMO Source · source.cuvetsmo.com</p>
            <p className="mt-1">
              ส่วนหนึ่งของระบบนิเวศ CUVETSMO — เว็บไซต์อ้างอิงทางการแพทย์ที่อาจารย์เซ็นต์รับทุก entry ·
              ทุกการอ้างอิงสามารถตรวจสอบได้ที่แหล่งต้นทาง
            </p>
            <p className="mt-3">
              <Link href="/sources" className="hover:text-source-700">วิธี curation ของเรา</Link>
              {' · '}
              <a href="https://cuvetsmo.com" className="hover:text-source-700">cuvetsmo.com</a>
              {' · '}
              <a href="https://github.com/palmzamak2547/cuvetsmo-source" className="hover:text-source-700">source code</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
