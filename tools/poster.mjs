// Render clean gallery posters for the landing page: design UI chrome hidden,
// 2x supersampled for crispness. Output → assets/posters/<slug>.png
// Usage: bash tools/poster.sh [slug]   (no slug → render all jobs)
import { chromium } from 'playwright';

const BASE = 'http://localhost:8080/designs/';
const OUT = new URL('../assets/posters/', import.meta.url).pathname;
// chrome classes shared across designs (via base.css) + common ad-hoc UI — all hidden for a clean hero
const HIDE = '.panels,.panel,.back,.gauge,.scroll-cue,.scrim,.loader,.hud,.legend,.nav,.caption,.controls,.cta,.overlay-ui,.readout,.meta,.hours,.credit';
const JOBS = [
  { slug: '01-house-walkthrough', pos: 0.05 },
  { slug: '03-solar-journey',     pos: 0.7 },
  { slug: '21-earth-descent',     pos: 0.40 },
  { slug: '02-cyberpunk-alley',   pos: 0.30 },
];

const only = process.argv[2];
const jobs = only ? JOBS.filter((j) => j.slug === only) : JOBS;
if (!jobs.length) { console.error('no job for slug: ' + only); process.exit(1); }

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });

for (const job of jobs) {
  await page.goto(BASE + job.slug + '/', { waitUntil: 'load', timeout: 30000 });
  await page.addStyleTag({ content: HIDE + '{opacity:0!important;visibility:hidden!important}' });
  await page.waitForTimeout(3000);                       // assets + first frames (textures decode)
  await page.evaluate((p) => {
    if (window.__scrollTo) return window.__scrollTo(p);
    const max = Math.max(0, document.body.scrollHeight - innerHeight);
    scrollTo(0, max * p);
  }, job.pos);
  await page.waitForTimeout(1400);                        // settle damped camera
  await page.screenshot({ path: OUT + job.slug + '.png', timeout: 180000 });
  console.log('poster →', job.slug);
}
await browser.close();
