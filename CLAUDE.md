# CLAUDE.md — cuvetsmo-source

## 🧭 Ecosystem role (canonical · locked 2026-05-29)
- **Role:** Canonical verified Thai medical/vet knowledge DATA layer — citation-grade drug/medical entries with provenance, faculty Ed25519 signoff, and ontology codes
- **Layer:** Knowledge-data
- **Live:** https://source.cuvetsmo.com
- **This repo OWNS (do not rebuild elsewhere):** The verified-knowledge corpus and its trust machinery — git-native flat JSON content (`content/drugs`, `content/citations`, `content/credentials`, `content/keys`, `content/log`), the citation chain (SHA-256 content-addressed CIDs + canonical JSON in `lib/cid.ts`), mirror provenance + upstream health probes, Ed25519 faculty signoff + browser verification (`lib/sign.ts`, `lib/verify-client.ts`), W3C Verifiable Credentials + did:web root of trust (`lib/did.ts`, `lib/vc.ts`), medical ontology backbone (ATC/RxNorm/ICD-11/LOINC in `data/ontology`, `lib/ontology.ts`), and the public read-only data API (`/api/drugs`, `/api/by-code`, `/api/keys`, `/api/log`, `/api/health`). Any other repo needing verified medical facts must CONSUME this (API or content), never re-author it.

### ⛔ No-duplication rule
Before building anything new in this repo, check `cuvetsmo-docs/NO_DUPLICATION.md`. Do NOT rebuild: knowledge backend (→ cuvetsmo-source), MCP/tool access (→ cuvetsmo-mcp), AI inference (→ shared ai-chat edge fn in webcuvetsmo), forms/approval workflow (→ webcuvetsmo), exam engine (→ vet-mock), DICOM viewer (→ cuvetsmo-imaging) — unless THIS repo is the canonical owner above.

### Rule for any new repo/subdomain
Must declare: (1) canonical source repo, (2) whether it is data / protocol / UI / workflow / product. If you cannot answer both, do not create it.
