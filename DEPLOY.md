# Deploy guide — source.cuvetsmo.com

> Step-by-step for Palm to deploy source.cuvetsmo.com to Vercel + connect via Cloudflare DNS. The agent can't run `vercel` for you (needs your auth tokens), so this is a copy-paste runbook.

---

## Pre-deploy checks (already passing)

These ran clean as of 2026-05-27:

```bash
npm run check       # ✓ 215/215 content units pass Iron Rule 0
npm run build       # ✓ all 240+ routes prerender successfully
```

If these still pass, proceed. If not, fix lint errors first.

---

## Step 1 — Deploy to Vercel

From `C:/Users/palmz/Desktop/cuvetsmo-source/`:

### First-time (no `.vercel/` folder yet)

```bash
# Install Vercel CLI globally if not yet installed
npm install -g vercel

# Login (opens browser to Vercel auth)
vercel login

# Deploy preview first (don't go to production yet)
vercel
# When prompted:
#   Set up and deploy "cuvetsmo-source"? [Y/n]  →  Y
#   Which scope?                                →  pick your account
#   Link to existing project?                   →  N
#   What's your project's name?                 →  cuvetsmo-source
#   In which directory is your code located?    →  ./
#   Want to modify these settings?              →  N (Next.js detected, defaults are fine)

# After successful preview deploy, get the URL like https://cuvetsmo-source-xxxxx.vercel.app
# Test the preview URL in browser.

# Deploy to production
vercel --prod
```

### If `.vercel/` already exists

```bash
vercel --prod
```

Output will show your **production URL** something like:
- `https://cuvetsmo-source.vercel.app` (canonical)
- `https://cuvetsmo-source-palmzamak2547.vercel.app` (account-scoped)

Open the canonical URL and verify it renders correctly.

---

## Step 2 — Add custom domain in Vercel

In the Vercel dashboard (or via CLI):

### Via dashboard
1. Open your `cuvetsmo-source` project in Vercel
2. Settings → Domains
3. Add domain: `source.cuvetsmo.com`
4. Vercel will say "Configuration required" and show DNS instructions

### Via CLI

```bash
vercel domains add source.cuvetsmo.com cuvetsmo-source
```

---

## Step 3 — Cloudflare DNS

You said Cloudflare is open and ready. Here's the exact DNS record to add:

### CNAME record

| Type | Name | Target | Proxy status | TTL |
|---|---|---|---|---|
| CNAME | `source` | `cname.vercel-dns.com` | **DNS only (gray cloud)** | Auto |

**Important:** Keep the proxy **OFF (gray cloud)** initially. This is so Vercel can issue a Let's Encrypt certificate via HTTP-01 challenge. The orange cloud (Cloudflare proxy) interferes with the ACME challenge.

### Wait for cert (usually 30-90 seconds)

```bash
# Test from terminal — should return HTTP/2 200 once cert is live
curl -I https://source.cuvetsmo.com/
```

If you see `Issued by Let's Encrypt` in the cert details, the cert is live.

### Optionally flip Cloudflare proxy ON

Once `source.cuvetsmo.com` returns 200 directly, you can toggle the Cloudflare proxy ON (orange cloud) if you want Cloudflare's CDN + WAF + analytics in front of Vercel. This is optional — Vercel's edge is already global.

**If you flip to proxy ON:**
1. Cloudflare Dashboard → DNS → Edit the `source` CNAME → toggle proxy to orange
2. Cloudflare SSL/TLS mode must be **Full (strict)** — not Flexible (which causes redirect loops)

---

## Step 4 — Verify deploy

Open these in your browser, all should return 200:

- https://source.cuvetsmo.com/ — landing
- https://source.cuvetsmo.com/drugs — 53+ drugs
- https://source.cuvetsmo.com/drugs/meloxicam — sample detail (try **Cmd+K** for search!)
- https://source.cuvetsmo.com/about — technology explainer
- https://source.cuvetsmo.com/use-cases — 8 personas
- https://source.cuvetsmo.com/health — citation health 100%
- https://source.cuvetsmo.com/api/health — JSON status

### Quick smoke (curl one-liner)

```bash
for url in / /drugs /verify /about /use-cases /privacy /health /api/health /sitemap.xml /robots.txt ; do
  curl -sS -o /dev/null -w "%{http_code}  $url\n" "https://source.cuvetsmo.com$url"
done
```

All should return 200.

---

## Step 5 — Update mirror probe (post-deploy)

The probe script in `scripts/mirror.mjs` references `cuvetsmo-source/0.0.1 (probe; +https://source.cuvetsmo.com/about)` as user-agent. After deploy, run:

```bash
node scripts/mirror.mjs
```

This refreshes citation health from your dev machine against the same upstream URLs. Probe results are stored in `content/citations/*.json` and visible at `/health`.

---

## Step 6 — First share

Use templates from `PITCH.md`:

1. **Email A** to 1 vet faculty member you trust (Aj. Ekkapol or your pharmacology lecturer)
2. **Email C** to 3-5 Vet 86 classmates
3. Pin link in your Line group / Discord / cohort chat

Watch `/feedback` for incoming GitHub issues. Watch `/log` for first faculty signature event.

---

## Troubleshooting

### "Domain verification failed" in Vercel

The CNAME record may not have propagated yet. DNS TTL = up to 5 minutes for new records. Wait 5 minutes and re-check.

```bash
nslookup source.cuvetsmo.com
# Should resolve to a Vercel edge IP
```

### "Too Many Redirects" after enabling Cloudflare proxy

Cloudflare SSL/TLS mode is set to Flexible. Change to **Full (strict)** in Cloudflare → SSL/TLS → Overview.

### "ERR_TLS_CERT_ALTNAME_INVALID"

Vercel hasn't finished issuing the cert yet. Cloudflare proxy may be interfering. Toggle Cloudflare proxy back to gray cloud, wait 60s, test again.

### Build fails on Vercel

Check `vercel.json` is empty/absent (it should auto-detect Next 16). Check build logs in Vercel dashboard. The local `npm run build` was passing as of last check.

### `npm install` fails on Vercel

Vercel uses Node 22 by default. Our `package.json` doesn't specify a Node version, so Vercel picks the latest LTS. If issues arise, add to `package.json`:

```json
"engines": {
  "node": ">=20"
}
```

---

## Post-launch monitoring

- **Citation health** — `/health` dashboard or `/api/health` JSON. Run `npm run mirror` weekly from a local cron, commit the probe results.
- **Search traffic** — Cloudflare analytics (if proxy is on) or Vercel analytics dashboard. We don't collect on-site analytics — these external dashboards are the only signal source.
- **Feedback inbox** — `https://github.com/palmzamak2547/cuvetsmo-source/issues?q=label%3Afeedback` shows everything submitted via `/feedback`.
- **GitHub stars** — proxy for early interest signal.
- **Faculty signoff queue** — track via `/log` (transparency log). First emerald-canonical entry = milestone.

---

## When Vercel says "100/day deploy quota reached"

You hit the Hobby plan quota. Wait for rolling 24h reset or upgrade to Pro ($20/mo). To prevent in future:

1. **Squash commits before pushing** — `git reset --soft <hash> && git commit` per batch
2. **Use `[skip ci]`** in commit messages for non-deploy commits (README, docs, scripts)
3. **One session = one deploy** unless you really need to ship multiple times

---

## When you want to deploy a change

```bash
# Make changes locally, test:
npm run check    # always before pushing
npm run dev      # visual check at localhost:3000

# Commit:
git add <specific-files>      # never `git add -A`
git commit -m "describe what changed"

# Push (auto-deploys via Vercel GitHub integration if configured):
git push

# Or manual deploy:
vercel --prod
```

That's it. Domain is live, signature flow is ready, faculty queue is open.
