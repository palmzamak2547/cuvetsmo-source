# Faculty Onboarding — source.cuvetsmo.com

> The 30-minute version. If you're a clinical faculty member who has agreed to review entries, this is how you go from "I said yes" to "first entry signed".

---

## Why this matters

Every drug entry on source.cuvetsmo.com ships with a cryptographic signature from a named faculty reviewer. That signature is your public commitment that you read the clinical content, cross-checked the dose against an authoritative source, and stand behind it.

The signature is verifiable in any reader's browser. If the entry is later tampered with, the signature breaks. If the entry stays unchanged, the signature persists forever — anyone reading it 10 years from now can confirm in their browser that you, specifically, vouched for it on this date.

This is structurally stronger than any reviewing relationship in print: print citations point at a Plumb's edition you may not have personally vetted. Here, only what you personally signed off carries your name.

---

## What you need before starting

- A computer with Node.js 20+ installed
- A GitHub account
- 30 minutes for first-time setup
- ~5 minutes per entry thereafter

That's it. No accounts to create on our side. No special hardware (yet — hardware-backed keys come in Phase 2 once we have enough faculty to justify the YubiKey logistics).

---

## Setup (first time only)

### Step 1 — Get the repo

```bash
git clone https://github.com/palmzamak2547/cuvetsmo-source.git
cd cuvetsmo-source
npm install
```

### Step 2 — Generate your signing key

Pick a short, stable identifier. Convention: `firstname.lastname` (no titles, no spaces). For example, `ekkapol.akb` or `nipa.cl`.

```bash
node scripts/keygen.mjs ekkapol.akb --display "ผศ.น.สพ.ดร. เอกพล อัครพุทธิพร"
```

This produces two files:

- `content/keys/ekkapol.akb.pub.json` — public key, lives in the repo. **Commit this.**
- `~/.cuvetsmo-keys/ekkapol.akb.priv.json` — private key, lives in your home directory. **Never commit. Never email. Never paste anywhere.**

### Step 3 — Register the public key

Create a PR titled `keys: register ekkapol.akb`. Include in the description:

- Your full name + title + department + faculty + affiliation
- The fingerprint that `keygen.mjs` printed (should look like `ed25519:abcdef0123456789`)
- A short statement of intent: which entry categories you plan to review (e.g. "NSAIDs, COX-2 inhibitors, perioperative analgesia in companion animals")

Once a maintainer merges, your key is registered. From that point on, `scripts/sign.mjs ... --signer ekkapol.akb` works from your machine and signatures verify against the public key in the repo.

---

## Reviewing your first entry (5 minutes)

### Pick an entry from the review queue

The amber-banner `/drugs` list shows entries that are mirrored from authoritative sources but not yet faculty-signed.

```bash
git pull origin main
ls content/drugs/
```

Open `content/drugs/<slug>.json` in your editor.

### Read every clinical section

Specifically:

- **`indications`** — is each Thai sentence faithful to the mirror source? Does it omit important nuances? Add missing indications.
- **`contraindications`** — same. Add anything you would warn a student about.
- **`sideEffects`** — same.
- **`dosages`** — **cross-check at least one row against an independent authoritative source.** This is the most safety-critical field. If a dose is wrong by an order of magnitude, you'll be the one who catches it.
- **`mechanism`** — is the Thai phrasing accurate and at the appropriate technical level?
- **`brandNamesTh`** — are the listed brands actually available in Thailand?

Edit freely. Strip every `TEMPLATE` marker. If you change `drafting.aiAssisted` from false to true (because you used Claude/ChatGPT to draft Thai phrasing), update the other drafting fields honestly.

### Add yourself as the reviewer

```json
"reviewedBy": {
  "name": "ผศ.น.สพ.ดร. เอกพล อัครพุทธิพร",
  "title": "ผู้ช่วยศาสตราจารย์",
  "department": "ภาควิชาเภสัชวิทยา",
  "affiliation": "คณะสัตวแพทยศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย",
  "date": "2026-06-15",
  "did": "did:web:source.cuvetsmo.com:faculty:ekkapol-akb",
  "signerKeyId": "ed25519:<your-fingerprint>"
}
```

The `did` field is optional in Phase 0 but recommended — it future-proofs your reviewer record for the Verifiable Credentials pipeline coming online in Phase 1.

### Run the lint

```bash
npm run check
```

This catches:
- Dangling citations
- Missing ontology codes
- Leftover TEMPLATE markers
- Broken hash chain
- AI policy violations

Fix what it flags. If something looks like a false positive, file an Issue with label `tooling` and a maintainer will look at the lint logic.

### Sign

```bash
node scripts/sign.mjs <slug> --signer ekkapol.akb
```

This appends your Ed25519 signature to the entry's `signatures[]` array, updates the version, adds a changelog entry, and appends a transparency log line. All in one command.

### Open the PR

```bash
git checkout -b sign/<slug>
git add content/drugs/<slug>.json content/log/transparency-log.jsonl
git commit -m "Sign <slug> after editorial review"
git push origin sign/<slug>
gh pr create --title "Sign <slug> — first faculty review" --fill
```

The PR template guides you through the rest.

Once a maintainer merges, the entry flips from amber pending to emerald canonical on the live site, and your name shows up in the trust stamp.

---

## What if you want to undo a signature?

You don't undo — you correct. If you discover later that a signed entry has a clinical error:

1. Open a PR fixing the content
2. Re-sign with `scripts/sign.mjs` (idempotent: same content = same signature, different content = new signature)
3. Add a changelog entry explaining what changed and why

Your old signature is still in git history. The transparency log shows both sign events. The reader gets the corrected version with both signatures' timestamps visible.

If you discover your private key was compromised, file an Issue with label `key-rotation`. The maintainer revokes the public key from the registry, you generate a new keypair, you re-sign your previously-reviewed entries with the new key.

---

## Boundaries

You sign for what **you** reviewed. You do not sign entries you have not personally read.

You sign for clinical content. You do not sign for translation polish — if the Thai grammar is off, fix it and re-sign, or let another reviewer who is a native speaker handle that pass.

You do not sign for an entry that you co-authored with AI without meeting the `humanEditsRatio >= 0.1` threshold (= you meaningfully edited the AI draft, not just rubber-stamped it).

You do not delegate signing to a research assistant or student. Your private key is yours. If a student helps with translation drafting, their name goes in `drafting.humanReviewer`, not yours — only the final reviewer who reads every line signs.

---

## What you get

- Public attribution on every entry you review (visible in the emerald trust stamp + the API + the transparency log)
- Inclusion in the contributor credits section on the site
- (Future, Phase 1+) A share of revenue from institutional API tier proportional to your department's signed entries
- (Future) DOI minting for entries you authored from scratch

---

## Where to ask questions

- **Content disagreement on a PR** — comment on the PR, ping a second reviewer
- **Tooling broken** — file Issue with label `tooling`
- **Schema question** — file Issue with label `schema`
- **Off-record** — email palm@cuvetsmo.com

---

*See also:*
- *CONTRIBUTING.md — full editorial workflow*
- *ARCHITECTURE.md — the 8-primitive synthesis*
- */verify in the deployed app — see how the cryptographic verification looks to readers*
