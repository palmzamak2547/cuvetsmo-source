# Pitch kit — source.cuvetsmo.com

> Ready-to-use elevator pitches + email templates for outreach to vet students, faculty, AI startups, hospitals, and journalists.

---

## 1-sentence pitches (by audience)

### To a vet student
"คู่มือยาสัตวแพทย์ภาษาไทย ฟรี ใช้ออฟไลน์ได้บนมือถือ, ทุก dose มี citation ที่ตรวจสอบได้, ทำขึ้นโดยนิสิตและอาจารย์ที่จุฬาฯ."

### To a vet faculty member
"Citation-grade Thai veterinary drug reference with cryptographic faculty signatures — like Plumb's but free, open-source, in Thai, and every claim has a verifiable provenance chain back to authoritative sources."

### To an AI startup founder
"Open API for cryptographically-signed Thai veterinary drug data. Every claim has a content-addressed citation. Use us to ground LLM responses with verifiable provenance — show your users 'source: cuvetsmo.com, signed by Dr. X.'"

### To a hospital pharmacist
"Public read API for veterinary drug data with ATC/RxNorm cross-references and Ed25519 signatures. Free for institutional pilot. EHR-integration ready."

### To a journalist / researcher
"First publicly-known platform combining 8 cryptographic + editorial primitives (Sigstore-style signing, content-addressed citations, W3C verifiable credentials, AI-in-loop policy enforcement, medical ontology backbone) into a single editorial pipeline for medical knowledge content — in Thai, for veterinary medicine."

---

## 60-second pitch (general)

> ในยุคที่ AI สร้างข้อความได้เป็นล้านในนาที สิ่งที่ขาดแคลนจริงคือ **ความเชื่อใจที่พิสูจน์ได้**.
>
> source.cuvetsmo.com คือชั้นข้อมูลทางการแพทย์สำหรับสัตวแพทย์ภาษาไทย ที่ทุก dose, ทุก indication, ทุก contraindication มี citation chain ตรวจสอบกลับไปยังแหล่งต้นทาง + ลายเซ็น Ed25519 ของอาจารย์ผู้รับผิดชอบ ที่ผู้อ่าน verify ได้ในเครื่องตัวเองโดยไม่ต้องเชื่อ server ของเรา.
>
> เราใช้ 8 เทคโนโลยีที่ไม่เคยมีใครรวมเข้าด้วยกันสำหรับ medical knowledge: cryptographic signatures, content-addressed citations, W3C verifiable credentials, AI-in-loop policy enforcement, medical ontology backbone (ATC + RxNorm + ICD-11 + LOINC), inverted API economics, git-native editorial workflow, offline PWA + WebGPU LLM.
>
> 53 drugs across 11 therapeutic classes seeded with cross-checked metadata. Public read free forever. Faculty signing flow + chain of trust visible at /trust. Ready for vet students today; faculty + AI startup integration next.

---

## Email templates

### Email A — to a vet faculty member you know

Subject: **Free Thai vet drug reference — would you be one of the first reviewers?**

> เรียน อ. <name>
>
> ผม (ปาล์ม Vet 86) กำลังสร้าง source.cuvetsmo.com — open-source veterinary drug reference ภาษาไทยที่ทุก dose, indication, contraindication ต้องมีอาจารย์ผู้เชี่ยวชาญลงนาม Ed25519 ก่อน publish เป็น canonical. แนวคิดคือ Plumb's ของไทย แต่ฟรี + verify ได้ในเครื่องผู้อ่านโดยไม่ต้องเชื่อ server.
>
> ตอนนี้มี 53 drugs across 11 therapeutic classes (NSAIDs, opioids, antibiotics, anesthetics, antiparasitics, antifungals, antihistamines, GI, cardiac, endocrine, corticosteroids, anticonvulsants, diabetes, hematology, antidotes, vet-only) — แต่ทั้งหมดยังเป็น "pending review" รอลายเซ็นอาจารย์.
>
> อยากเชิญให้อาจารย์เป็น **first faculty reviewer**. การลงนาม entry แรกใช้เวลา ~30 นาที (setup ครั้งเดียว) + ~5 นาที per entry ต่อจากนั้น. ทุกลายเซ็นของอาจารย์จะปรากฏใน trust stamp ของ entry + ใน chain of trust ที่ public verify ได้ทุกเวลา.
>
> ลิงก์ที่เกี่ยวข้อง:
> - https://source.cuvetsmo.com — main site
> - https://source.cuvetsmo.com/about — explanation of the 8 technology primitives
> - https://source.cuvetsmo.com/onboarding — 5-step faculty walkthrough
> - https://source.cuvetsmo.com/trust — current chain of trust (board key, ready for faculty additions)
>
> ถ้าสนใจ ตอบ email นี้ + บอกว่าอาจารย์อยากตรวจ category ไหน (NSAIDs / antibiotics / cardiac / ...). ผมจะสร้าง public-key registration PR + ส่ง entry แรกให้ tested.
>
> ขอบคุณครับ
> ปาล์ม
> palm@cuvetsmo.com

### Email B — to an AI startup founder

Subject: **Free verifiable provenance layer for vet AI products**

> Hi <name>
>
> source.cuvetsmo.com is a citation-grade Thai veterinary drug reference with Ed25519 signatures + content-addressed citations + W3C verifiable credentials. Public read API is free forever (rate-limit headers + CORS-enabled, no signup).
>
> The reason this might matter to you: AI products that ground responses in our data can show end-users "Source: cuvetsmo.com, signed by Dr. X on YYYY-MM-DD" with a clickable verify link that runs Ed25519 verification in the user's browser. No more "the AI claimed it but who can verify?"
>
> Endpoints (all return JSON, CORS enabled):
> - GET /api/drugs — list all canonical entries
> - GET /api/drugs/<slug> — single drug, includes citations + signatures
> - GET /api/by-code?system=atc&code=M01A — filter by ontology code (ATC, RxNorm)
> - GET /api/keys/<kid> — fetch a signer's public key for verification
> - GET /api/log — transparency log of all signing events
> - GET /api/health — citation upstream-URL health (100% currently)
>
> Phase 0 has 53 drugs (pending faculty signoff). Phase 1 starts adding faculty signatures + canonical flips. Phase 2: bulk dataset export + DOI minting via institutional tier (revenue-share with contributing departments).
>
> Documentation: https://source.cuvetsmo.com/api
> Use cases: https://source.cuvetsmo.com/use-cases
>
> If this fits your roadmap, would love to discuss what endpoints we should prioritize. Reply or open an issue at github.com/palmzamak2547/cuvetsmo-source/issues with label `integrate-api`.
>
> — Palm, founder

### Email C — to a vet student classmate

Subject: **เปิด demo ดูได้แล้ว — คู่มือยาสัตวแพทย์ภาษาไทย ที่ผมทำ**

> สวัสดี <name>
>
> ที่ทำมาเล่าให้ฟังบ่อยๆ — เว็บคู่มือยาสัตวแพทย์ภาษาไทย เปิดดูได้แล้วที่ https://source.cuvetsmo.com (ตอนนี้ยังเป็น Phase 0 — ยา 53 ตัวรอ faculty review).
>
> เปิดดูสัก 5 นาทีแล้วบอกหน่อย:
>
> 1. เข้า https://source.cuvetsmo.com/drugs — รู้สึกอย่างไรกับ list ของยา?
> 2. กดเข้าไปดู /drugs/morphine หรือ /drugs/meloxicam — layout ดูง่ายไหม?
> 3. ลอง search ที่ /search — typing ดูว่า lag ไหม
> 4. **คำถามสำคัญ: ถ้านี่ภาษาไทยเต็มและ canonical แล้ว จะใช้ก่อนสอบ/rotation/การบ้านไหม?**
>
> ตอบสั้นๆใน LINE หรือ comment ที่ /feedback ของเว็บ (ไม่ต้อง login) ก็ได้. signal จาก 5 คนใน cohort ของเราพอจะ confirm ว่าทางถูก
>
> ขอบคุณครับ
> ปาล์ม

### Email D — to a journalist covering Thai healthtech

Subject: **First medical reference platform combining 8 cryptographic primitives**

> Dear <name>,
>
> A 4th-year Thai vet student (Anuthin "Palm" Danoi, Chula Vet 86) has shipped what may be the first publicly-known platform combining 8 architectural primitives into a single editorial pipeline for medical knowledge content: Sigstore-style Ed25519 signing, content-addressed citations, AI-in-loop policy enforcement, W3C Verifiable Credentials, medical ontology backbone (ATC + RxNorm + ICD-11 + LOINC), inverted API economics, git-native editorial workflow, and offline-capable PWA.
>
> The platform addresses a documented crisis: ChatGPT-3.5 hallucinates 39-55% of medical citations; even GPT-4o + Claude 3.7 still 15-20% (35-55% on niche topics). 90% of clinicians have encountered medical AI hallucinations; 85% believe they can harm patients.
>
> Each adjacent primitive has prior art (Sigstore for software, blockchain for drug supply chain, W3C VC for medical licensing), but their composition into a single editorial pipeline for medical content — particularly in a national language — appears to be novel based on 2023-2026 literature review.
>
> Site: https://source.cuvetsmo.com
> Plain-language tech explainer + 11 cited sources: https://source.cuvetsmo.com/about
> Code: https://github.com/palmzamak2547/cuvetsmo-source (MIT-licensed)
>
> Happy to walk through the design or arrange a demo.
>
> Best,
> Palm
> palm@cuvetsmo.com

---

## Talking points / FAQ

**Q: Why isn't this just Plumb's?**
A: Plumb's is paid (USD ~300/yr), English-only, 200+ editor team, US-centric. We are free, Thai, smaller catalog day-1 (compounds over time), and crucially: every claim has a verifiable cryptographic provenance chain. Plumb's says "trust us"; we say "verify the math."

**Q: Why isn't this just blockchain medicine?**
A: No token. No mining. No smart contracts. No speculation. Ed25519 signatures + Git history + content addressing — boring, standardized, battle-tested cryptography. The blockchain medicine projects (CARRE on Ethereum, etc.) were research prototypes for biomedical knowledge notarization; we're a production drug reference with the cryptographic layer as a *feature*, not the *product*.

**Q: Why isn't this just an AI chatbot?**
A: We are explicitly NOT an AI generator. AI may *draft* (Phase 5+ in-browser Phi-3 mini), but AI is never the *authority* — every canonical claim has a named human reviewer with a registered Ed25519 key. The platform is the *static knowledge layer* that AI products can cite, not a chatbot that generates answers.

**Q: How does this make money long-term?**
A: Public reads stay free forever. Institutional API tier (Phase 1+) pays for: bulk dataset export, contributing back signed entries, dataset DOI minting. Revenue distributed back to contributing faculty departments. No retail B2C revenue. No ads. No data sales.

**Q: What if a faculty reviewer's private key is compromised?**
A: Open a key-rotation Issue. Compromised key gets revoked from `content/keys/`; reviewer generates a new keypair; previously-signed entries are re-signed with the new key. Old signatures remain in git history but verify as "pre-rotation" status.

**Q: What if my hospital wants to use the API but can't pay institutional fees yet?**
A: Public read is free + no rate-limit enforcement in Phase 0. Use it. Tell us your integration via /feedback so we can prioritize endpoints.

**Q: Where do faculty sign?**
A: /onboarding has the full 30-minute walkthrough. CLI-based (Node + Git), no web form for signing — keeping the cryptographic chain explicit + auditable.

**Q: Is this related to cuvetsmo.com (main site)?**
A: Yes — source.cuvetsmo.com is the verified-knowledge sub-domain in the CUVETSMO ecosystem. Sibling sub-domains include labs.cuvetsmo.com (experimental tools), imaging.cuvetsmo.com (DICOM viewer), web3.cuvetsmo.com (educational Web3 sandbox). Same brand, different surface.

---

## Demo flow (when sharing live)

1. **Open https://source.cuvetsmo.com/** → editorial hero with stats
2. **Click "Who actually uses this?"** → /use-cases with 8 personas + Defi-vs-us comparison
3. **Click "How it works"** → /about with the 8 primitives explained + 11 cited sources
4. **Click "Drug Reference"** → /drugs → see 53 entries grouped by 11 classes
5. **Click /drugs/morphine** → sidebar showing trust stamp + signatures + ontology + mirror chips
6. **Click "Verify in browser →"** → /verify/meloxicam → watch the emerald stamp + check-draw animation when Web Crypto verifies the signature
7. **Click /trust** → see the chain of trust hierarchy
8. **Click /health** → see 132/132 citations probed, 100% healthy
9. **Click /api** → see the public read endpoints

Total demo: ~5 minutes. Stops talking ≈ persuasion.
