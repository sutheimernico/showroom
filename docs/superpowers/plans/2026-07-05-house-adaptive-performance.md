# 01-house Adaptive Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** `01-house-walkthrough` must run smoothly on weak laptops (user's laptop froze on load) without sacrificing the look on strong GPUs — via three quality tiers picked by GPU heuristic, corrected live by measured frame times, and hardened by a context-loss escape hatch.

**Architecture:** One `QUALITY` module inside the existing script block. A static heuristic (renderer string + cores + DPR) picks the initial tier; a rolling frame-time governor steps the tier DOWN (never up) when the median frame exceeds budget; consumers (shadows, glass, GTAO, grass count, pixelRatio, env-bake throttle) read tier settings. On `webglcontextlost`, reload with a forced-low flag in sessionStorage. `?tier=high|med|low` overrides everything for testing.

**Tech stack:** unchanged (Three r185, existing scene). Verification: shot harness (SwiftShader ⇒ LOW path must keep working) + real-GPU check by Nico.

**Why the laptop died (current cost stack on weak GPUs):** transmission glass re-renders the scene into a buffer; GTAO adds a depth/normal prepass; 4096² PCFSoft shadows; 45k grass instances; PMREM re-bakes during scroll; pixelRatio up to 2 on a HalfFloat MSAA composer target. All of it is currently all-or-nothing (`SOFT_GPU` only distinguishes SwiftShader).

---

### Task 1: Tier module + static heuristic + override

**Files:** Modify `designs/01-house-walkthrough/index.html` (script block, right after the `SOFT_GPU` detection).

- [ ] **Step 1.1:** Insert:

```js
// ---------------------------------------------------------------- quality tiers
// LOW must look "reduced", never broken: cheap glass + fewer blades still read as
// the same design. Static guess first; the governor (Task 2) only steps DOWN.
const TIERS = {
  high: { shadow: 4096, grass: 45000, physGlass: true,  gtao: true,  dpr: 2,    envStep: 0.03, msaa: true  },
  med:  { shadow: 2048, grass: 22000, physGlass: false, gtao: false, dpr: 1.5,  envStep: 0.06, msaa: true  },
  low:  { shadow: 1024, grass: 9000,  physGlass: false, gtao: false, dpr: 1,    envStep: 0.12, msaa: false },
};
function guessTier() {
  const url = new URLSearchParams(location.search).get('tier');
  if (url && TIERS[url]) return url;
  if (sessionStorage.getItem('house-forced-low')) return 'low';
  if (SOFT_GPU) return 'low';
  const weakGpu = /intel(?!.*arc)|uhd|iris|vega \d|radeon\(tm\)|mali|adreno|apple gpu/i.test(_glinfo);
  const weakCpu = (navigator.hardwareConcurrency || 8) <= 4;
  if (weakGpu || weakCpu) return 'med';        // med first; governor drops to low if needed
  return 'high';
}
let tier = guessTier();
const Q = () => TIERS[tier];
```

- [ ] **Step 1.2:** Consumers — replace the current hard-wired choices:
  - renderer: after `makeRenderer()`, `renderer.setPixelRatio(Math.min(devicePixelRatio, Q().dpr));`
  - sun shadows: `sun.shadow.mapSize.set(Q().shadow, Q().shadow);` (replaces the SOFT_GPU ternary)
  - `ENV_STEP` → `let envStep = Q().envStep;` and use `envStep` in `bakeEnv`
  - grass: `const COUNT = Q().grass;` — build at the CURRENT tier's count, and additionally cap `inst.count` in the governor (Task 2) since instanced count can shrink live for free
  - glass: `const glass = Q().physGlass ? <physical material> : <cheap material>;` (replaces the SOFT_GPU ternary; keep BOTH material definitions)
  - GTAO: `if (Q().gtao) { ... }` (replaces `!SOFT_GPU`)
  - `makeComposer` MSAA: lib decides via its own software check — leave as is (msaa flag reserved; see Task 3 note).
- [ ] **Step 1.3:** Verify (shot harness → SwiftShader must resolve to `low`): `SHOT_POS="0,1" bash tools/shot.sh http://localhost:8123/designs/01-house-walkthrough/ house-perf-t1 1600 900` — no console errors, frames visually match the current LOW look (fewer blades acceptable). Also verify `?tier=med` loads error-free (functional check only — visuals can't be judged on SwiftShader).
- [ ] **Step 1.4:** Commit `feat(01-house): quality tier table + static GPU heuristic`.

### Task 2: Frame-time governor (live step-down)

**Files:** same file, render loop + tier module.

- [ ] **Step 2.1:** Insert after the tier module:

```js
// rolling frame-time governor: if the median of the last 40 frames blows the
// budget, step down one tier and apply the cheap-to-switch settings live.
// Never steps up (avoids oscillation). Skips the first 60 frames (load spikes).
const BUDGET_MS = 33;                    // ~30fps floor before we degrade
const frameTimes = [];
let framesSeen = 0;
function applyTierLive() {
  const q = Q();
  renderer.setPixelRatio(Math.min(devicePixelRatio, q.dpr));
  sun.shadow.mapSize.set(q.shadow, q.shadow);
  if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }   // force realloc
  envStep = q.envStep;
  grassMesh.count = Math.min(grassMesh.count, q.grass);   // instanced count shrinks free
  if (gtao) gtao.enabled = q.gtao;
  for (const pane of glassPanes) pane.material = q.physGlass ? glassPhys : glassCheap;
}
function governor(dt) {
  if (++framesSeen < 60 || tier === 'low') return;
  frameTimes.push(dt * 1000);
  if (frameTimes.length < 40) return;
  frameTimes.sort((a, b) => a - b);
  const median = frameTimes[20];
  frameTimes.length = 0;
  if (median > BUDGET_MS) { tier = tier === 'high' ? 'med' : 'low'; applyTierLive(); }
}
```

- [ ] **Step 2.2:** Wiring this needs three small refactors: keep references `grassMesh` (return `inst` from `buildLawn`), `glassPanes` + both materials `glassPhys`/`glassCheap` (collect pane meshes in `buildGlazing`), and `gtao` already exists. Call `governor(dt)` at the top of the `loop()` callback.
- [ ] **Step 2.3:** Verify: shot run error-free; then a functional governor test — load with `?tier=high` under SwiftShader and confirm via console (temporary `console.info` on step-down, keep it: one line per step-down is useful diagnostics) that it steps high→med→low within a few seconds. VIEW one frame after step-down: must still render correctly (glass swapped, fewer blades, no black frame).
- [ ] **Step 2.4:** Commit `feat(01-house): frame-time governor steps quality down live`.

### Task 3: Context-loss escape hatch + load-cost trims

**Files:** same file.

- [ ] **Step 3.1:** Context loss → forced low + reload (the "laptop died" belt):

```js
renderer.domElement.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  sessionStorage.setItem('house-forced-low', '1');
  location.reload();
});
```

- [ ] **Step 3.2:** Load-spike trims (cheap wins, all tiers): (a) `sun.shadow.autoUpdate` pattern — leave auto (scene is dynamic), skip; (b) build the lawn in an idle callback (`requestIdleCallback` with `setTimeout` fallback) so 45k matrix composes don't block first paint; (c) `renderer.compile(scene, camera)` once after `manager.onLoad` and before dismissing the loader — shader compile happens behind the overlay instead of as a first-scroll jank/freeze. (This is the likeliest single cause of the "froze while loading" report: transmission + GTAO + PCFSoft compile storm at first render.)
- [ ] **Step 3.3:** Verify: shot run error-free, loader still dismisses, no regression in the three-frame sweep.
- [ ] **Step 3.4:** Commit `fix(01-house): context-loss low-tier reload + compile behind loader + idle lawn build`.

### Task 4: Verification + docs

- [ ] **Step 4.1:** Full sweep `SHOT_POS="0,0.2,0.4,0.6,0.8,1"` — error-free, VIEW all frames (LOW look intact).
- [ ] **Step 4.2:** PLAN.md log entry (tier table, governor, context-loss hatch, compile-behind-loader; note that MED/HIGH visuals still need Nico's real-GPU check — `?tier=` makes A/B easy).
- [ ] **Step 4.3:** Outcome section in this plan doc. Commit `docs(01-house): log adaptive performance pass`.

**Judgement points:** tier thresholds (BUDGET_MS, grass counts) are starting values — tune against Nico's real-hardware feedback, not SwiftShader. The governor's step-down `console.info` stays in as diagnostics.

## Outcome (2026-07-05)

All 4 tasks implemented (commits 8d9e610, dc1336c, cfa02bf + this docs commit).
Deviations: pixelRatio consumer sits after the tier module (declaration order), low tier grass
9000 replaces the old SOFT_GPU 7000, glass materials are now both constructed up front so the
governor can swap them live. Open: real-GPU validation of tier thresholds and governor behavior
(BUDGET_MS 33, grass counts, med-tier heuristic regex are starting values — tune against Nico's
hardware feedback); MSAA flag in the tier table is reserved, composer MSAA still decided by
shared lib's software check.

**Review fast-follow (2026-07-05):** context-loss reload now guards on the existing
`house-forced-low` flag (reload once, never loop); `manager.onLoad` pre-warms BOTH glass
variants so a governor step-down swaps materials without a synchronous compile stall.
Residual accepted gaps: the idle-built lawn shader compiles outside the loader overlay
(minor — single standard material), and the `if (grassMesh)` guard in `applyTierLive` is
load-bearing against the idle-build race.
