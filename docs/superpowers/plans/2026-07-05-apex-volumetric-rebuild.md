# 23-apex-descent Volumetric Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace 23-apex-descent's placeholder-backdrop architecture (canvas gradients waiting on Higgsfield credits — user verdict: ugly/boring) with a fully real-time, much more detailed 400 km→4 m descent: real earth-from-orbit opening, RAYMARCHED volumetric cloud deck you physically punch through, a dense believable megacity, and the neon street finale. No AI-still dependency — this plan unblocks the design from Higgsfield entirely.

**Architecture:** Keep the design's identity and chrome: 5 stations (Drop Point → Cloud Deck → Crown Line → The Canyon → Street), log-altitude gauge rail, whiteout transitions, panels, rain, post chain. Replace the 5 static backdrop planes with real 3D stages that share one world-space camera fall. The signature moment is the cloud punch-through: a raymarched volumetric slab (3D fbm/Worley density, sun-lit with self-shadowing) that the camera enters, whites out inside, and exits above the city. City tech (window-atlas towers, neon street) is COPIED from the 02 rebuild (designs stay self-contained per PROJECT.md — no shared module).

**Dependency note:** Tasks 4–5 lift building/street/neon systems from `2026-07-05-alley-bladerunner-rebuild.md` — execute that plan first (recommended) or budget extra time to build them here first.

**Tech stack:** Three r185, GSAP/Lenis (unchanged), NASA earth textures COPIED from `designs/21-earth-descent/textures/` (already CC0/public domain, provenance in its SOURCES.md — duplicate the files + a SOURCES.md note, keep designs self-contained). Verification: shot harness (`:8123`, never `:8080`).

---

### Task 0: Baseline + strip placeholders

- [ ] Baseline shot sweep of the current state (`apex-baseline`, 5 station positions per the stations data).
- [ ] Remove: the 5 canvas placeholder painters, `manifest.json` gating, backdrop planes, the `assets/apex` lookup. Keep: stations data, altitude gauge, panels, whiteout sweeps, rain system, star field, cloud-puff sprites, post chain, scroll rig.
- [ ] Verify: renders (empty stages + chrome), zero console errors. Commit `feat(23-apex): strip placeholder backdrops — chrome kept`.

### Task 1: World-space fall + orbit stage

- [ ] **Unified camera fall:** map scroll t (log-scale, matching the gauge: 400 km→4 m) to camera altitude; stage content lives at real relative scales (orbit stage: earth sphere far below; from ~2 km the city fades in via fog). One continuous fall — the whiteout sweeps mask the two hard LOD handovers (orbit→cloud, cloud→city).
- [ ] **Orbit stage:** earth sphere (NASA day texture + normal + night lights on the dark side, from 21's texture set), atmosphere rim (fresnel shell + Rayleigh-ish gradient: horizon `#7fb4e8` → zenith `#03050c` as altitude drops), star field above, sun with lens-glare sprite. Camera looks down-forward at the terminator so city lights hint at the destination.
- [ ] Verify station 1 frames: curvature + atmosphere read photographic (the NASA albedo does the heavy lifting). Commit `feat(23-apex): continuous log-altitude fall + NASA orbit stage`.

### Task 2: Volumetric cloud deck (the signature moment)

- [ ] **Raymarched slab:** full-screen-ish box (e.g. 30×4×30 km at 8–12 km altitude) with a ShaderMaterial raymarcher: 40–64 steps, density = fbm(worley×perlin, 4 octaves, 3D texture baked once into a 128³ `Data3DTexture` at load — NOT per-frame noise), 6-step light march toward the sun for self-shadowing, Beer–powder term, blue-grey ambient from below, warm sun from above. Horizon fade so the slab edge never shows.
- [ ] **Punch-through choreography:** density fades in from station 1→2; inside the deck (~1.5 s of scroll) the whiteout sweep peaks exactly when transmittance ≈ 0 (reuse the existing sweep, retimed); exiting reveals the city below through breaking cloud bottoms (density thins with altitude).
- [ ] **Cost control:** the raymarcher renders on a half-resolution offscreen target composited before bloom (upsampled with depth-aware blur is overkill — plain bilinear passes at this softness); LOW tier swaps the slab for 3 parallax cloud-card layers (the existing puff texture, big quads).
- [ ] Verify: mid-deck frame (lit cloud tops with visible self-shadowed billows — NOT fog soup), exit frame (city appearing through gaps). This is the task with the most iteration; budget 3–5 shader-tuning rounds. Commit `feat(23-apex): raymarched volumetric cloud deck with punch-through`.

### Task 3: City stages — Crown Line + Canyon

- [ ] Port the window-atlas tower system from the 02 rebuild; scale it up: ~200 towers in rings (dense core, sparse edge), 80–450 m heights, crown beacons (red pulse) on the tallest 20, two air-traffic lane heights.
- [ ] Crown Line (800 m): camera skims tower tops; roof details (helipads = emissive H circles, antenna clusters) on the ~15 towers nearest the path.
- [ ] Canyon (120 m): fall path threads between two mega-towers (thicker instanced tiers + a few unique hero boxes with sign clusters from the 02 neon system); rain begins (existing system), fog densifies, sign light tints the rain.
- [ ] Verify at both stations: parallax sells scale (near towers sweep past fast, far core crawls); no tower intersects the fall path. Commit `feat(23-apex): window-atlas megacity — crown line + canyon`.

### Task 4: Street finale

- [ ] Last 120 m→4 m: decelerating ease lands the camera 4 m above a neon street tile ported from the 02 rebuild (one block: reflector road or — if perf demands — its LOW static variant, 10–15 signs, 2 holograms, steam, splash rings). The altitude gauge pins at 4 M; final panel fades in.
- [ ] Verify: landing frame is a hero (street glow + rain + reflections filling the frame); deceleration feels like arrival, not a crash (aim tilts from down-forward to forward during the last 200 m).
- [ ] Commit `feat(23-apex): neon street landing`.

### Task 5: Post, tiers, verification, docs

- [ ] Altitude-driven grade: exposure/contrast per stage (space hard-contrast → cloud soft white → city warm haze), god-ray sprite when exiting the cloud deck against the sun. Bloom ramps with descent (existing pattern).
- [ ] Port `TIERS`/governor/context-loss from the house perf plan (knobs: raymarch steps 64/40/cards, half-res→third-res clouds, tower count, reflector on/off, dpr).
- [ ] Full 8-position sweep + per-frame VIEW, portrait spot-check, poster regen, PLAN.md log entry (incl.: Higgsfield dependency REMOVED — `tools/higgsfield-gen.mjs` stays for other designs; placeholder painters deleted), Outcome section here. Commit `docs(23-apex): log volumetric rebuild outcome + poster`.

**Judgement points:** cloud density/lighting parameters (Task 2 — the hard one), city skyline composition (Task 3), landing choreography (Task 4). SwiftShader caveat: the raymarcher will be brutally slow in the harness — use tiny shot sizes (`800 450`) for iteration frames and judge composition only; real perf lives on Nico's GPU behind the tier governor.
