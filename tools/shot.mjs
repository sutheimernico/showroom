// Playwright screenshot harness for showroom designs.
// Renders a design at several scroll positions and reports console errors,
// so the build loop can verify visuals instead of building blind.
//
// Usage: node tools/shot.mjs <url> <slug> [width] [height]
//   node tools/shot.mjs http://localhost:8080/designs/01-house-walkthrough/ house
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

if (!url) { console.error('usage: node tools/shot.mjs <url> <slug> [w] [h]'); process.exit(1); }

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

await browser.close();

if (errors.length) {
  console.log(`ERRORS (${errors.length}):`);
  for (const e of errors.slice(0, 25)) console.log('  ' + e);
} else {
  console.log('OK — no console errors');
}
console.log('shots → ' + outDir);
