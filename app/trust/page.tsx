// /trust — chain-of-trust visualization.
//
// Shows the cryptographic dependency tree:
//
//   did:web:source.cuvetsmo.com  (the platform DID)
//     └── cuvetsmo-board key     (the board's Ed25519 key, declared in the DID document)
//          ├── EditorialAuthorityCredential (self-issued root credential)
//          └── meloxicam v1, signed at ...  (each entry the key has signed)
//
// As more faculty come online, each gets their own subtree under the
// board key (because the board is the issuer of their VC attestation).

import Link from 'next/link'
import { readFile } from 'fs/promises'
import { existsSync, readdirSync } from 'fs'
import path from 'path'
import { DRUGS } from '@/lib/drugs'
import { listCredentials } from '@/lib/credentials'
import { readLog } from '@/lib/log'
import { shortCID } from '@/lib/cid'

export const metadata = {
  title: 'Chain of trust',
  description: 'The cryptographic dependency tree — DID → signing keys → credentials + signed entries. The full provenance hierarchy of source.cuvetsmo.com.',
}

type PubKey = {
  kid: string
  displayName: string
  fingerprint: string
  generatedAt: string
}

async function loadKeys(): Promise<PubKey[]> {
  const dir = path.join(process.cwd(), 'content', 'keys')
  if (!existsSync(dir)) return []
  const files = readdirSync(dir).filter(f => f.endsWith('.pub.json'))
  const out: PubKey[] = []
  for (const f of files) {
    try {
      const data = JSON.parse(await readFile(path.join(dir, f), 'utf8'))
      out.push({
        kid: data.kid,
        displayName: data.displayName ?? data.kid,
        fingerprint: data.fingerprint,
        generatedAt: data.generatedAt,
      })
    } catch { /* skip */ }
  }
  return out
}

async function loadPlatformDID(): Promise<{ id: string; verificationMethods: { id: string; kid: string }[] } | null> {
  const filePath = path.join(process.cwd(), 'public', '.well-known', 'did.json')
  if (!existsSync(filePath)) return null
  try {
    const doc = JSON.parse(await readFile(filePath, 'utf8'))
    return {
      id: doc.id,
      verificationMethods: (doc.verificationMethod ?? []).map((vm: { id: string; publicKeyJwk?: { kid?: string } }) => ({
        id: vm.id,
        kid: vm.publicKeyJwk?.kid ?? vm.id.split('#').pop() ?? '',
      })),
    }
  } catch { return null }
}

export default async function TrustPage() {
  const did = await loadPlatformDID()
  const keys = await loadKeys()
  const credentials = listCredentials()
  const log = readLog()
  const signedDrugs = DRUGS.filter(d => d.signatures.length > 0)

  return (
    <article className="max-w-4xl">
      <header className="border-b border-paper-300 pb-7">
        <p className="eyebrow">Chain of trust</p>
        <h1 className="display-h1 mt-3">Provenance hierarchy.</h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          ทุก entry, signature, และ credential บนเว็บนี้ตามรากกลับไปยัง <b>หนึ่ง</b> DID — <code className="rounded bg-paper-100 px-1.5 py-0.5 text-[14px]">{did?.id ?? 'did:web:source.cuvetsmo.com'}</code>.
          ด้านล่างคือต้นไม้ครบทุก link ของ trust ที่ปัจจุบันมีอยู่.
        </p>
      </header>

      <section className="mt-10">
        {/* Tree root — Platform DID */}
        <TreeNode
          icon="🏛"
          eyebrow="Platform DID · root of trust"
          title={did?.id ?? 'did:web:source.cuvetsmo.com'}
          subtitle="W3C Decentralized Identifier · resolves to /.well-known/did.json"
          tone="emerald"
          link="/.well-known/did.json"
          linkLabel="View DID document ↗"
        />

        {/* Branch — verification methods (keys declared in DID doc) */}
        <Branch>
          {did?.verificationMethods.map(vm => {
            const key = keys.find(k => k.kid === vm.kid)
            const keyCredentials = credentials.filter(
              c => c.credential.proof?.verificationMethod === vm.id,
            )
            const keyLog = log.filter(e => e.signerKeyId === key?.fingerprint)
            const keyDrugs = signedDrugs.filter(d =>
              d.signatures.some(s => s.signerKeyId === key?.fingerprint)
            )

            return (
              <div key={vm.id} className="space-y-4">
                <TreeNode
                  icon="🗝"
                  eyebrow="Verification method · Ed25519"
                  title={key?.displayName ?? vm.kid}
                  subtitle={key?.fingerprint ?? vm.id}
                  tone="source"
                  meta={key?.generatedAt ? `generated ${key.generatedAt.slice(0, 10)}` : undefined}
                />

                {/* Sub-branch — credentials this key has issued */}
                {keyCredentials.length > 0 && (
                  <Branch indent={1}>
                    <p className="eyebrow mb-2">Issued credentials ({keyCredentials.length})</p>
                    <ul className="space-y-3">
                      {keyCredentials.map(c => {
                        const types = c.credential.type.filter(t => t !== 'VerifiableCredential')
                        return (
                          <li key={c.slug}>
                            <TreeNode
                              icon="📜"
                              eyebrow={types.join(' · ')}
                              title={c.slug}
                              subtitle={`Subject: ${c.credential.credentialSubject.id}`}
                              tone="paper"
                              meta={c.credential.issuanceDate?.slice(0, 10)}
                              link={`/credentials/${c.slug}`}
                              linkLabel="View credential →"
                            />
                          </li>
                        )
                      })}
                    </ul>
                  </Branch>
                )}

                {/* Sub-branch — signed drug entries */}
                {keyDrugs.length > 0 && (
                  <Branch indent={1}>
                    <p className="eyebrow mb-2">
                      Signed entries ({keyDrugs.length})
                      {keyDrugs.length !== keyLog.length && (
                        <span className="ml-2 text-ink-500">· {keyLog.length} signing events</span>
                      )}
                    </p>
                    <ul className="space-y-3">
                      {keyDrugs.map(d => {
                        const canonical = d.reviewedBy !== null
                        return (
                          <li key={d.slug}>
                            <TreeNode
                              icon={canonical ? '✓' : '🔏'}
                              eyebrow={canonical ? 'Canonical · faculty-reviewed' : 'Infrastructure signature · not canonical'}
                              title={`${d.nameEn} · ${d.nameTh}`}
                              subtitle={d.class}
                              tone={canonical ? 'emerald' : 'amber'}
                              meta={`v${d.version} · ${d.lastUpdated}`}
                              link={`/drugs/${d.slug}`}
                              linkLabel="View entry →"
                              secondLink={`/verify/${d.slug}`}
                              secondLinkLabel="Verify ↗"
                            />
                          </li>
                        )
                      })}
                    </ul>
                  </Branch>
                )}

                {keyCredentials.length === 0 && keyDrugs.length === 0 && (
                  <Branch indent={1}>
                    <p className="text-xs italic text-ink-500">
                      No issued credentials or signed entries yet under this key.
                    </p>
                  </Branch>
                )}
              </div>
            )
          })}
        </Branch>
      </section>

      {/* How to read this */}
      <aside className="mt-16 rounded-md border-l-4 border-source-300 bg-source-50/40 px-6 py-5 text-sm">
        <p className="eyebrow">How to read this tree</p>
        <p className="mt-2 leading-relaxed text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          Each arrow downward = a cryptographic dependency. The platform DID owns the keys; the keys sign credentials and entries; each
          signed entry derives its trustworthiness from the parent key&apos;s legitimacy. If the platform DID document
          changes (i.e. a new key registers or an old one is revoked), <b>git history shows when</b> — anyone can audit
          via <code className="rounded bg-paper-100 px-1.5 py-0.5 text-[13px]">git log -p public/.well-known/did.json content/keys/</code>.
        </p>
        <p className="mt-3 leading-relaxed text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          As more faculty come online (Phase 1+), each gets their own sub-tree under <code>cuvetsmo-board</code> —
          attested by a <code>VeterinaryLicenseAttestation</code> credential signed by the board.
        </p>
      </aside>
    </article>
  )
}

// ──────────────────────────────────────────────────────────────────

function TreeNode({
  icon, eyebrow, title, subtitle, meta, tone, link, linkLabel, secondLink, secondLinkLabel,
}: {
  icon: string
  eyebrow: string
  title: string
  subtitle: string
  meta?: string
  tone: 'emerald' | 'amber' | 'source' | 'paper'
  link?: string
  linkLabel?: string
  secondLink?: string
  secondLinkLabel?: string
}) {
  const tones = {
    emerald: 'border-emerald-400 bg-emerald-50/60',
    amber:   'border-amber-400   bg-amber-50/60',
    source:  'border-source-400  bg-paper-50',
    paper:   'border-paper-300   bg-paper-50',
  } as const
  return (
    <div className={`rounded-md border-2 p-5 ${tones[tone]}`}>
      <div className="flex items-start gap-4">
        <span aria-hidden className="text-2xl leading-none mt-0.5">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{eyebrow}</p>
          <h3 className="mt-1.5 break-all text-[17px] font-semibold tracking-tight text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            {title}
          </h3>
          <p className="mt-1 break-all text-xs text-ink-700">{subtitle}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            {meta && <span className="tabular text-ink-500">{meta}</span>}
            {link && linkLabel && (
              <Link href={link} className="text-source-800 underline-offset-2 hover:underline" {...(link.startsWith('http') || link.startsWith('/.well-known') ? { target: '_blank', rel: 'noreferrer' } : {})}>
                {linkLabel}
              </Link>
            )}
            {secondLink && secondLinkLabel && (
              <Link href={secondLink} className="text-source-800 underline-offset-2 hover:underline">
                {secondLinkLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Branch({ children, indent = 0 }: { children: React.ReactNode; indent?: number }) {
  return (
    <div
      className="relative mt-4 space-y-4"
      style={{ paddingLeft: `${(indent + 1) * 24}px` }}
    >
      <div
        className="pointer-events-none absolute top-0 bottom-3 w-px bg-paper-300"
        style={{ left: `${(indent + 1) * 8}px` }}
        aria-hidden
      />
      {children}
    </div>
  )
}
