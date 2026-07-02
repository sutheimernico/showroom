#!/usr/bin/env node
// Dev-time tool: generate Higgsfield Soul stills (text2image) into assets/.
// Auth comes from .env (HF_API_KEY / HF_API_SECRET) — never commit those.
//
// Usage:
//   node tools/higgsfield-gen.mjs --prompt "..." --out assets/apex/stage-1.jpg \
//     [--size 2048x1152] [--quality 1080p] [--seed 7] [--dump]
//
// Protocol (derived from higgsfield-ai/higgsfield-client source):
//   POST {BASE}/v1/text2image/soul  body = flat JSON arguments
//   → { request_id, status_url, cancel_url }
//   GET status_url until status ∈ completed|failed|nsfw|canceled
//   completed payload carries the result URL(s).

import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://platform.higgsfield.ai';

function loadEnv() {
  const out = {};
  for (const line of readFileSync(resolve(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  if (!out.HF_API_KEY || !out.HF_API_SECRET) throw new Error('HF_API_KEY / HF_API_SECRET missing in .env');
  return out;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) args[key] = argv[++i];
      else args[key] = true;
    }
  }
  if (!args.prompt || !args.out) {
    console.error('Required: --prompt "..." --out path/to/file.jpg');
    process.exit(2);
  }
  return args;
}

const env = loadEnv();
const args = parseArgs(process.argv.slice(2));
const AUTH = `Key ${env.HF_API_KEY}:${env.HF_API_SECRET}`;

async function api(method, url, body) {
  const res = await fetch(url.startsWith('http') ? url : BASE + url, {
    method,
    headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* keep raw */ }
  if (!res.ok) {
    const err = new Error(`${method} ${url} → HTTP ${res.status}: ${text.slice(0, 1000)}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

// Depth-first hunt for image URLs in an arbitrary result payload — the exact
// shape isn't documented, so don't assume one.
function findImageUrls(node, found = []) {
  if (typeof node === 'string') {
    if (/^https?:\/\/\S+/.test(node) && !node.includes('platform.higgsfield.ai/requests')) found.push(node);
  } else if (Array.isArray(node)) {
    for (const v of node) findImageUrls(v, found);
  } else if (node && typeof node === 'object') {
    for (const v of Object.values(node)) findImageUrls(v, found);
  }
  return found;
}

const params = {
  prompt: args.prompt,
  width_and_height: args.size || '2048x1152',
  quality: args.quality || '1080p',
  batch_size: 1,
};
if (args.seed) params.seed = Number(args.seed);

console.log(`→ submitting soul job (${params.width_and_height}, ${params.quality})`);
const sub = await api('POST', '/v1/text2image/soul', { params });
console.log(`  request_id: ${sub.request_id}`);

let status;
const t0 = Date.now();
for (;;) {
  await new Promise(r => setTimeout(r, 5000));
  status = await api('GET', sub.status_url);
  process.stdout.write(`  status: ${status.status} (${Math.round((Date.now() - t0) / 1000)}s)\n`);
  if (['completed', 'failed', 'nsfw', 'canceled'].includes(status.status)) break;
  if (Date.now() - t0 > 10 * 60 * 1000) { console.error('timeout after 10min'); process.exit(1); }
}

if (args.dump || status.status !== 'completed') console.log(JSON.stringify(status, null, 2));
if (status.status !== 'completed') process.exit(1);

const urls = findImageUrls(status);
if (!urls.length) { console.error('completed but no result URL found — payload above'); console.log(JSON.stringify(status, null, 2)); process.exit(1); }

const outPath = resolve(ROOT, args.out);
mkdirSync(dirname(outPath), { recursive: true });
const img = await fetch(urls[0]);
if (!img.ok) { console.error(`download failed: HTTP ${img.status} ${urls[0]}`); process.exit(1); }
writeFileSync(outPath, Buffer.from(await img.arrayBuffer()));
console.log(`✓ saved ${args.out} (${urls.length} url(s), took ${Math.round((Date.now() - t0) / 1000)}s)`);

// Register apex stage stills in the manifest the design reads (avoids 404 probing).
const fileName = args.out.split('/').pop();
if (/assets\/apex\/stage-\d+\.jpg$/.test(args.out)) {
  const manPath = resolve(ROOT, 'assets/apex/manifest.json');
  const man = existsSync(manPath) ? JSON.parse(readFileSync(manPath, 'utf8')) : { stills: [] };
  if (!man.stills.includes(fileName)) man.stills.push(fileName);
  man.stills.sort();
  writeFileSync(manPath, JSON.stringify(man, null, 2) + '\n');
  console.log(`✓ manifest updated (${man.stills.length} stills)`);
}

// Provenance next to the asset (repo convention: SOURCES.md per asset dir).
const src = resolve(dirname(outPath), 'SOURCES.md');
const line = `- \`${args.out.split('/').pop()}\` — Higgsfield Soul text2image, request_id \`${sub.request_id}\`, ${params.width_and_height}/${params.quality}${params.seed ? `, seed ${params.seed}` : ''}. Prompt: "${args.prompt}"\n`;
if (!existsSync(src)) writeFileSync(src, `# Sources — generated via Higgsfield Cloud API (account-owned outputs)\n\n${line}`);
else appendFileSync(src, line);
