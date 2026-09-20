# Plan: Unblock & Curate — showroom

**Date:** 2026-07-21 · **Status:** awaiting go · **Executor:** any capable agent (self-contained — no session context required)

## Context (verified 2026-07-21 by code review)

showroom is a 3D design lab (Three.js, no build step, CDN importmap, one self-contained folder per design under `designs/NN-slug/`, thin shared layer in `shared/lib.js`, Playwright shot harness in `tools/`). 23 concepts planned, 6 touched, **only 4 genuinely finished** (01 house, 03 solar, 08 particle-morph, 21 earth-descent — all at high craft level with honest failure documentation). No remote, ever.

The real state, which PLAN.md currently misrepresents:
- `02-cyberpunk-alley` shows ☑ but was rejected by Nico ("flat boxes with painted-on puddles"); a 7-task rebuild plan exists (`docs/superpowers/plans/2026-07-05-alley-bladerunner-rebuild.md`) with **only Tasks 1–2 done** — current disk state is an unfinished regression.
- `23-apex-descent` (◐) is blocked on an empty Higgsfield wallet — but a complete **credit-free** alternative plan exists (`docs/superpowers/plans/2026-07-05-apex-volumetric-rebuild.md`, raymarched cloud layer + city tech ported from 02) with **0 of 5 tasks executed**.
- Working tree: branch `feat/01-house-realism`, last commit 2026-07-05, three files with uncommitted mid-work diffs (01 bollards/hedges keyframes+loadModel block, 02 wet-street additions, `shared/lib.js` `attachLifecycle` extras param) — no verify run, no log entry for this state.
- Doc drift: PLAN.md header says "The 20 concepts" over a 23-row table; gallery registry (`index.html` `LIVE[]`/`LAB[]`) duplicates the PLAN.md table with no coupling.
- Process finding: SwiftShader-only verification has proven **unreliable as an acceptance filter** — 2 of 5 scenes marked ☑ needed real rework after Nico's GPU look. The GPU gate must move earlier in the loop, per scene, not sit at merge time.
- Small tech debt: `mulberry32` PRNG copy-pasted in 03 and 23; BokehPass listed in PROJECT.md's stack but never exercised in any scene.

Project principles (keep): no build step, self-contained designs, asset provenance via `SOURCES.md` (CC0/CC BY only), seeded determinism, `attachLifecycle` + `reducedMotion` in every scene, anti-"AI-look" pass per design, autopilot loop per LOOP.md (one concept per iteration, progress lives on disk).

## Goal

Truth the state, finish the two already-planned rebuilds (removing the Higgsfield dependency entirely), extract the buried learning value (techniques catalog), and set up the remaining concepts as a curated curriculum with a GPU gate that fires per scene instead of at the very end.

## Execution rules

- Stay on `feat/01-house-realism` until Phase A commits land, then continue on it (merging is Nico's, gated on his GPU check). Conventional Commits, English. No remote — never push.
- Verify loop per scene change: `python3 -m http.server 8123` (8080 is Airflow's) + `node tools/shot.mjs <design>` — zero console errors, screenshots eyeballed for obvious breakage (black frames, NaN smears). SwiftShader FPS numbers stay labeled non-representative.
- The two 2026-07-05 rebuild plan documents are the **authority** for their tasks — follow them, don't re-derive; deviations get noted in their outcome sections.
- Never discard uncommitted work; never touch `tools/shots/` (gitignored debug artifacts).

---

## Phase A — Recover truth (do this first, it's cheap)

### Task 1: Dirty-tree triage
Run the shot harness against 01 and 02 in their current uncommitted state. Whatever the result, **commit the diffs** — split into three honest commits (01 additions, 02 wet-street start, lib.js lifecycle extras) with messages stating verification status ("verified: loads clean, shots eyeballed" or "wip: unverified mid-work state, see plan"). If a scene errors: still commit (as `wip:`), and note the error in the message — recovery beats a 16-day-old dangling diff.
**Accept:** `git status` clean; each commit message states what was verified.

### Task 2: Truth the docs
**Files:** `PLAN.md`, `index.html`.
- Header "The 20 concepts" → 23; `02` status ☑ → ◐ ("rebuild in progress, plan 2026-07-05, tasks 3–7 open"); `23` note points at the credit-free plan.
- Add a "Technique taught" column to the concept table (fill for the 6 built ones from the progress log; leave planned ones for Task 8).
- Registry de-duplication, no-build-conform: move `LIVE[]`/`LAB[]` into `designs/registry.json`; `index.html` fetches it at runtime. PLAN.md table keeps prose status but gains a one-line note that `registry.json` is the machine source for the gallery.
**Accept:** no contradiction between table, header and gallery; gallery renders identically from the JSON.

---

## Phase B — Execute the two plans that already exist

### Task 3: Alley Blade-Runner rebuild, Tasks 3–7
**Authority:** `docs/superpowers/plans/2026-07-05-alley-bladerunner-rebuild.md`.
Wet reflector street, neon/holograms, volumetric light, camera/text polish, perf tiers + verification — exactly as specified there. Fold the uncommitted wet-street start (Task 1's commit) into the plan's task structure. Shot-harness verify per task; the plan's own acceptance criteria apply.
**Accept:** all 7 plan tasks done; PLAN.md 02 → ☑ *(GPU-check pending)* — see Task 9's new status semantics.

### Task 4: Apex volumetric rebuild, Tasks 0–5 (kills the Higgsfield dependency)
**Authority:** `docs/superpowers/plans/2026-07-05-apex-volumetric-rebuild.md`.
Raymarched cloud layer + ported city technique replace the AI backdrops entirely. Remove the Higgsfield client dependency from this design's path (leave `tools/higgsfield*` untouched — other designs may want it someday; just nothing depends on it anymore).
**Accept:** all plan tasks done; 23 renders credit-free; PLAN.md 23 → ☑ *(GPU-check pending)*; no 403-dependent code path left in the scene.

---

## Phase C — Shared-layer + portfolio extraction

### Task 5: Lift the duplicated helpers
**Files:** `shared/lib.js`, `designs/03-*/index.html`, `designs/23-*/index.html`.
`mulberry32` (word-identical in 03/23) and the NaN-scrub shader pattern move into `shared/lib.js`; scenes import them. Pure functions only — the self-contained principle stays intact for scene-specific logic.
**Accept:** shot harness clean on 03 and 23; no behavioral diff (seeded output identical — assert one sampled value per scene before/after).

### Task 6: TECHNIQUES.md — excavate the buried learning value
**Files:** new `TECHNIQUES.md`, linked from README/PROJECT.md.
Extract from PLAN.md's 400-line progress log into a catalog: technique → scene → the pitfall story (instanceMatrix trap, NaN-pow bloom smear, AgX exposure calibration, tier governor with frame-rate downgrade, WebGPU/TSL fallback, reflector double-tonemapping…). One entry per technique, 3–6 lines each, honest about what was painful. This is the growth-area evidence (3D/graphics engineering) currently invisible inside a changelog.
**Accept:** ≥10 entries, each linking scene + log date; readable standalone.

### Task 7: Contact sheet + motion capture (headless acceptance prep)
**Files:** new `tools/contact-sheet.mjs`, extend `tools/shot.mjs`.
- Contact sheet: one static HTML page (written to `tools/contact-sheet.html`, gitignored territory ok) tiling all designs × all scroll stops from fresh shot runs — built to make Nico's real-GPU acceptance a 10-minute batch instead of per-scene ceremony.
- Motion: extend the harness to capture a frame sequence → webm per finished scene (`tools/captures/`, gitignored). Labeled SwiftShader-quality — for layout/motion judgment and portfolio drafts, not final beauty shots.
**Accept:** one command regenerates the sheet; one command produces a webm per ☑ scene.

---

## Phase D — Curriculum + process fix

### Task 8: Curate the remaining 17 → a recommended 5
**Files:** PLAN.md (new "Curriculum" section).
Score each open concept on: (a) genuinely new technique taught, (b) reuse from built scenes, (c) effort bucket (S/M/R&D). Fixed starting recommendation to write down (adjust only with explicit reasoning from the scoring): **09 raymarch-fractal** (SDF raymarching — fully new), **19 fluid-sim** (GPGPU Navier-Stokes — R&D like 08's WebGPU pivot), **18 black-hole** (inherits 03's lensing shader — cheap win), **14 depth-tunnel** and **11 aurora** (cheapest "wow recipe" entries per PROJECT.md). The rest get an honest "teaches nothing new / palette variant" tag. Building any of them is **not** part of this plan — the curation is the deliverable; Nico picks.
**Accept:** every open concept scored; recommendation table with rationale; no scene built.

### Task 9: Move the GPU gate into the loop
**Files:** `LOOP.md`, PLAN.md status legend.
New status semantics: ☑ means "SwiftShader-verified, **GPU-check pending**"; a new ✅ (or ☑✓) means "Nico-accepted on real hardware". Loop rule change: after each scene reaches ☑, the loop **stops for that scene** and adds it to a "GPU-Checkliste" section in PLAN.md (with contact-sheet reference) instead of the old pattern where ☑ was treated as done — this is the structural fix for "2 of 5 needed rework after the real look". Backfill current statuses honestly (which scenes has Nico actually accepted? From the log: 01 and 03 were reworked *after* his look — mark accordingly; 08/21 pending).
**Accept:** LOOP.md and PLAN.md legend updated; GPU checklist section exists and lists every pending scene.

---

## Verification before completion
1. Shot harness clean (zero console errors) on all six scenes; registry.json ↔ gallery consistency; seeded-determinism spot checks from Task 5.
2. `git status` clean, all work committed on `feat/01-house-realism` with honest messages.
3. grep sweep: no "20 concepts" remnant, no ☑ without GPU-pending marker in the new semantics, no Higgsfield reference in 23's scene code.
4. Append an **Outcome** section here + outcome notes in both 2026-07-05 plan docs; update AUTOPILOT_LOG.md.

## Needs Nico (not agent-executable)
- Go for this plan.
- The GPU checklist batch: real-hardware pass over all ☑ scenes via the contact sheet (this is the gate everything funnels into — 10 minutes with the new tooling).
- Merge decision for `feat/01-house-realism` after the house passes his GPU look.
- Pick from the Task-8 curriculum (which of the recommended 5 get built next, if any).
- Optional: decide whether Higgsfield ever gets credits again (nothing depends on it after Task 4).
