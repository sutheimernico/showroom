# Showroom — Autopilot iteration log

One line per completed iteration. Full detail lives in `PLAN.md`'s Progress log.

- 2026-07-02 — `02-cyberpunk-alley` built and registered (4/22 live). Fixed a missing `instanceMatrix`
  transform in the alley-wall shader (all instances were collapsing onto one block) plus follow-on
  brightness/exposure tuning once real geometry appeared. See `PLAN.md` Progress log for detail.
- 2026-07-02 — quality pass across all 4 live pieces: real MSAA in `shared/lib.js`'s new
  `makeComposer()` (samples:4 on WebGL2, with a SwiftShader/software-rasterizer detection guard —
  see `PLAN.md` Progress log for why the guard is load-bearing, not optional polish), the
  02/03/21 chromatic-aberration/vignette/grain `ShaderPass` deduplicated into `makeGradePass()`,
  `01`'s camera lerp made frame-rate independent, and GPU resource lifecycle (`attachLifecycle()`:
  pagehide dispose + context-loss recovery) wired into all 4. `tools/shot.mjs` now also measures
  achieved fps (rAF-delta sampling over a driven scroll sweep), clearly labeled as a SwiftShader
  (non-GPU) lower bound. See `PLAN.md` Progress log for full detail and numbers.
