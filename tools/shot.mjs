// Playwright screenshot harness for showroom designs.
// Renders a design at several scroll positions and reports console errors,
// so the build loop can verify visuals instead of building blind.
//
// Usage: node tools/shot.mjs <url> <slug> [width] [height]
//   node tools/shot.mjs http://localhost:8080/designs/01-house-walkthrough/ house
//
// Also measures achieved frame rate (rAF-delta sampling while driving a scroll sweep, see
// measureFPS below) unless SHOT_FPS=0. IMPORTANT: this harness always runs headless Chromium on
// SwiftShader (a software GL rasterizer — see the launch args below), never a real GPU. Treat the
// reported fps as a non-GPU LOWER BOUND only: it's useful for catching regressions between runs
// on this same machine, not as a real-world 60fps claim.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const url = process.argv[2];
const slug = process.argv[3] || 'design';
const W = parseInt(process.argv[4] || '1600', 10);
const H = parseInt(process.argv[5] || '900', 10);
// supersample factor: render the drawing buffer at DSF× and downscale → crisp shots
const DSF = parseInt(process.env.SHOT_DSF || '1', 10);
// positions: default sweep, or a custom comma-separated list via SHOT_POS
// (e.g. SHOT_POS="0,0.1,0.4,0.7,1" to hit station centers of a multi-stop design)
const positions = (process.env.SHOT_POS || '0,0.25,0.5,0.75,1.0')
  .split(',').map((s) => parseFloat(s.trim())).filter((n) => !Number.isNaN(n));
const FPS_MS = parseInt(process.env.SHOT_FPS_MS || '3500', 10);
const measureFps = process.env.SHOT_FPS !== '0';

if (!url) { console.error('usage: node tools/shot.mjs <url> <slug> [w] [h]'); process.exit(1); }

// Samples real rAF-to-rAF deltas for `duration`ms while continuously driving __scrollTo across
// the full 0..1 range, so the measurement includes scroll/ScrollTrigger/Lenis overhead, not just
// an idle static frame. Returns { avgFps, lowFps } — lowFps is the 5th-percentile-delta framerate
// (a "1%-low"-style worst-case figure), avgFps the mean. Drops the first few samples (post-jump
// settle) before computing stats.
async function measureFPS(page, duration) {
  const deltas = await page.evaluate((duration) => new Promise((resolve) => {
    const deltas = [];
    const start = performance.now();
    let last = start;
    function frame(now) {
      deltas.push(now - last);
      last = now;
      const t = (now - start) / duration;
      if (window['__scrollTo']) window['__scrollTo'](Math.min(1, t));
      if (now - start < duration) requestAnimationFrame(frame);
      else resolve(deltas);
    }
    requestAnimationFrame(frame);
  }), duration);
  // drop up to the first 3 frames (scroll-jump settle) — but never so many that a render this
  // slow (a handful of frames in the whole window) leaves nothing to compute stats from
  const settled = deltas.slice(Math.min(3, Math.max(0, deltas.length - 1)));
  if (settled.length === 0) return null; // too slow to sample even one full frame in the window
  const avgMs = settled.reduce((a, b) => a + b, 0) / settled.length;
  const sorted = [...settled].sort((a, b) => a - b);
  const p95Ms = sorted[Math.floor(sorted.length * 0.95)];
  return { avgFps: 1000 / avgMs, lowFps: 1000 / p95Ms, frames: settled.length };
}

const outDir = new URL(`./shots/${slug}/`, import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

try {
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
} catch (e) {
  console.log('NAV FAILED: ' + e.message);
  await browser.close();
  process.exit(2);
}
await page.waitForTimeout(2800); // assets + first frames

for (let i = 0; i < positions.length; i++) {
  const p = positions[i];
  await page.evaluate((p) => {
    if (window['__scrollTo']) return window['__scrollTo'](p);
    const max = Math.max(0, document.body.scrollHeight - window.innerHeight);
    window.scrollTo(0, max * p);
  }, p);
  await page.waitForTimeout(1100); // let scroll-driven (and damped-camera) animation settle
  // heavy fragment shaders at DSF=2 rasterize slowly under SwiftShader → allow more than the 30s default
  await page.screenshot({ path: outDir + `p${String(i).padStart(2, '0')}_${Math.round(p * 100)}.png`, timeout: 180000 });
}

let fps = null;
if (measureFps) {
  await page.evaluate((p) => window['__scrollTo'] && window['__scrollTo'](p), 0); // scroll ramp starts fresh at 0
  await page.waitForTimeout(300);
  fps = await measureFPS(page, FPS_MS);
}

await browser.close();

if (errors.length) {
  console.log(`ERRORS (${errors.length}):`);
  for (const e of errors.slice(0, 25)) console.log('  ' + e);
} else {
  console.log('OK — no console errors');
}
if (measureFps) {
  if (fps) {
    console.log(
      `FPS (SwiftShader software render — NOT GPU-representative, lower bound only): ` +
      `avg=${fps.avgFps.toFixed(1)} low=${fps.lowFps.toFixed(1)} (n=${fps.frames} frames / ${FPS_MS}ms, scroll 0→1)`
    );
  } else {
    console.log(`FPS: could not sample a single frame in ${FPS_MS}ms — rendering is currently far below 1fps (host contention and/or this concept's cost under SwiftShader).`);
  }
}
console.log('shots → ' + outDir);
