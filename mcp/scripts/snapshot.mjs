#!/usr/bin/env node
// prepublishOnly: freeze a point-in-time snapshot of the data plane into the
// package so the published npm tarball is self-contained (the consumer won't
// have the parent repo's content/ + data/ dirs). data.ts reads _data/ when it
// exists, else the live repo files. Re-run = re-snapshot.
import { mkdirSync, readdirSync, copyFileSync, rmSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MCP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPO_ROOT = resolve(MCP_ROOT, '..')
const OUT = join(MCP_ROOT, '_data')

const copyDir = (src, dst, filter = () => true) => {
  mkdirSync(dst, { recursive: true })
  let n = 0
  for (const f of readdirSync(src)) {
    if (!filter(f)) continue
    copyFileSync(join(src, f), join(dst, f))
    n++
  }
  return n
}

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true })
const drugs = copyDir(join(REPO_ROOT, 'content', 'drugs'), join(OUT, 'drugs'), f => f.endsWith('.json'))
const onto = copyDir(join(REPO_ROOT, 'data', 'ontology'), join(OUT, 'ontology'), f => f.endsWith('.json'))
console.log(`snapshot: ${drugs} drug files + ${onto} ontology files -> mcp/_data/`)
