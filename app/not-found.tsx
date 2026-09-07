import Link from 'next/link'

// Branded 404 — a mistyped slug should land on the catalog, not a blank page.
export default function NotFound() {
  return (
    <article className="mx-auto max-w-2xl py-10 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display-h1 mt-3">ไม่พบหน้านี้</h1>
      <p className="mx-auto mt-4 max-w-md text-ink-700">
        ลิงก์อาจพิมพ์ผิดหรือ entry ถูกย้าย — ค้นหาชื่อยาได้ทันที หรือเริ่มจากคู่มือยาทั้งหมด
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/drugs" className="rounded-sm bg-source-800 px-4 py-2 text-sm font-medium text-paper-50 transition hover:bg-source-900">
          Drug Reference
        </Link>
        <Link href="/search" className="rounded-sm border border-paper-300 bg-paper-50 px-4 py-2 text-sm text-ink-700 transition hover:border-source-500 hover:text-source-800">
          Search
        </Link>
      </div>
      <p className="mt-8 text-[12px] text-ink-500">
        กด <kbd className="rounded border border-paper-300 bg-paper-100 px-1 py-px font-mono text-[10px]">⌘K</kbd> หรือ{' '}
        <kbd className="rounded border border-paper-300 bg-paper-100 px-1 py-px font-mono text-[10px]">/</kbd> เพื่อค้นจากทุกหน้า
      </p>
    </article>
  )
}
