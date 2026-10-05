# showroom — LOOP (per-iteration prompt for the autonomous build agent)

You are a fresh headless agent. You do ONE high-value thing, verify it, commit it, and exit.
Progress lives on disk (this file, `PLAN.md`, git history) — never in context.

## Per-iteration protocol
1. Read `AUTOPILOT.md` (author's global loop rules, not part of this repo) (global rules), then this `LOOP.md`, then `PROJECT.md` and
   `PLAN.md`.
2. Confirm you are on branch `autopilot/work` (the runner guarantees this; if not, stop).
   NOTE: this repo had no git history before the runner set it up — `autopilot/work` was cut
   right after the first commit of the pre-existing state, so `main` here is minimal on purpose.
3. Pick the SINGLE highest-value open concept from `PLAN.md`'s concepts table (top to bottom
   among `☐ todo` entries).
4. Follow `PLAN.md`'s own loop mechanic for that concept: **Direct** (invoke the `frontend-design`
   skill: color tokens, type pairing, layout, ONE signature element — avoid the "AI look") →
   **Build** (`designs/NN-slug/index.html` from the shared stack skeleton) → **Register** (card
   in `index.html`, status ☑ in `PLAN.md`, one-line note in the progress log).
5. Run the gate: `PLAN.md`'s quality gates — zero console errors, no WebGL context loss, holds
   ~60fps (pixelRatio ≤ 2, pause rAF when tab hidden). Use the playwright harness under `tools/`
   to check console errors where feasible.
6. On green: commit (Conventional Commits, English, imperative). Then exit.
7. If a concept's "wow bar" / templated-look self-assessment is borderline: mark it `◐ in
   progress` instead of `☑ done`, note why in the progress log, and let Nico make the final call.

## Project-specific hard constraints (never override)
- **Local-first.** No build step, no external calls beyond CDN libs + CC0 assets, no tracking.
- **Self-contained.** Each `designs/NN-slug/` must run on its own; shared code only in `shared/`.
- **No remote.** This repo has no git remote and none should be created — local commits only.
- The subjective "does it clear the bar" judgment is Nico's to confirm; you can self-assess
  against the written checklist but should flag anything borderline rather than just marking done.

## Gate (objective done-check)
Zero console errors, ~60fps, one card registered in `index.html` per completed concept.

## Where things are
- Vision/bar/stack: `PROJECT.md`
- Concepts/status/loop mechanic: `PLAN.md`
- Gallery: `index.html` · Designs: `designs/NN-slug/` · Shared helpers: `shared/`
