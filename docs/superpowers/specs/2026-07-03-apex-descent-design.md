# Apex — Orbital Descent (design 23) — Design Spec

Date: 2026-07-03 · Status: approved by Nico ("bau das zu ende"), executing autonomously.

## Goal

The repo's first hybrid AI-asset + realtime piece, and the new quality benchmark ("Higgsfield-level").
One scroll axis = one uninterrupted fall from low orbit (400 km) to a rain-soaked neon street (4 m)
of a photorealistic futuristic megacity. The wow moment is the seamless scale jump, made legible by
a HUD altitude readout. Must clear every bar in PROJECT.md (wow in 5s, scroll-driven, cinematic
post, ~60 fps, self-contained, not templated-looking).

## Why hybrid (decision record)

- Pure realtime Three.js cannot reach AI-photo realism in browser budget → photoreal backdrops
  come from Higgsfield Soul stills (text2image API).
- Pure scrubbed AI video would demote the piece to a video player → all motion, atmosphere,
  parallax, transitions and interactivity stay realtime Three.js.
- Stills (not video) keep credit cost low and avoid cross-shot consistency failures.

## The five stages

| # | Altitude | Backdrop (AI still) | Realtime layers |
|---|----------|--------------------|-----------------|
| 1 | 400 km | city grid glowing through clouds, Earth limb | stars, atmosphere limb glow, HUD start |
| 2 | 12 km | cloud sea, tower tips piercing the deck | volumetric cloud sprites, whiteout transition |
| 3 | 800 m | upper-skyline vista between tower crowns | beacon blink lights, haze, traffic particles |
| 4 | 120 m | narrowing street canyon | rain starts, window lights, subtle camera shake |
| 5 | 4 m | street-level neon hero (wet asphalt, crowd) | instanced rain streaks (02 pattern), reflection streaks, grade |

Shared look across stills via one prompt foundation: night, cold blue high altitude → neon
magenta/cyan at street level, consistent atmosphere/light direction, photoreal, cinematic 35mm.

## Architecture

- Backdrops: each still on a large, slightly curved plane far from camera (no fragile image
  segmentation); parallax depth comes from procedural silhouette layers in front (dark instanced
  building masses, 02 pattern) + atmosphere between camera and backdrop.
- Transitions: cloud/haze whiteouts choreographed by scroll mask backdrop crossfades
  (uniform-driven mix, FBO not required).
- Scroll rig: repo standard — Lenis + GSAP/ScrollTrigger, one normalized 0→1 progress; altitude
  maps log-scale 400 km → 4 m.
- Post: `shared/lib.js` `makeComposer` (MSAA guard) + UnrealBloom + `makeGradePass`; lifecycle via
  `attachLifecycle`; reduced-motion honored (no shake/sway, keep crossfades).
- Self-contained under `designs/23-apex-descent/`; stills local under `assets/apex/` — no runtime
  calls beyond CDN libs (LOOP.md constraint holds).

## AI pipeline

- `tools/higgsfield-gen.mjs`: calls Higgsfield Cloud API (`POST /v1/text2image/soul`,
  `Authorization: Key $HF_API_KEY:$HF_API_SECRET` from `.env`), polls job, downloads results to
  `assets/apex/`, writes prompt + params next to each image (`SOURCES.md`).
- Phase 0: 1 test still → validates wallet balance, cost per still, look. Abort criteria: auth or
  payment failure → build proceeds with procedural placeholder backdrops, blocker reported.
- Phase 1: generate the 5 stage stills (re-roll individual stages if style drifts).
- Phase 2: build → verify (`tools/shot.mjs` sweep + quality gates) → register (gallery card,
  PLAN.md row + log, poster).

## Risks / fallbacks

1. Empty API wallet → Phase 0 catches it; placeholder backdrops keep the build unblocked.
2. Style drift between stills → shared prompt foundation; re-roll worst offender only.
3. "Cardboard" parallax feel → procedural foreground silhouettes + atmosphere carry depth;
   transitions carry the dynamism.
4. Big textures vs performance → WebP ≤ 2K per still, pixelRatio cap 2 (repo standard).

## Outcome (2026-07-03)

Implemented as designed, with one planned deviation: **risk 1 fired.** Phase 0 returned
`403 Not enough credits` — the Higgsfield Cloud API wallet is empty (auth itself verified, 200 on
`/v1/motions`). The piece shipped end-to-end on procedural placeholder backdrops; status ◐ in
PLAN.md pending Nico's wallet top-up and the wow-bar call.

- Built: `designs/23-apex-descent/` (5 stages, whiteout handoffs, parallax towers, rain, log-scale
  altitude rail), `tools/higgsfield-gen.mjs` (submit/poll/download + manifest + SOURCES.md),
  `assets/apex/manifest.json` (gates still loading — avoids 404 console errors), gallery card,
  poster job (street stage).
- Deviations from spec: none in architecture. Additions found necessary during verification:
  `toneMapped:false` on backdrops (ACES crushed them), `scrub:true` instead of `scrub:1` and no
  CSS transition on panels (both never settled at software-render fps in the shot harness).
- Open: Phase 1 (generate 5 stills — one `node tools/higgsfield-gen.mjs` call per stage once the
  wallet has credits), then regenerate the poster and flip PLAN.md to ☑ if it clears the bar.
