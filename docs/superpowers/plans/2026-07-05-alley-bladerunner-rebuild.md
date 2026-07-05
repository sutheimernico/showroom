# 02-cyberpunk-alley „Blade-Runner Night" Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Rebuild `designs/02-cyberpunk-alley` from "flat boxes with painted-on puddles" (user verdict: ugly, boring) into a rain-soaked Blade-Runner night street: believable architecture, REAL wet-street reflections, volumetric light, animated neon/holograms — while keeping the proven scroll rig, rain system, station/panel chrome, and post pipeline.

**Architecture:** Same single-file design (`index.html`), same forward-dolly scroll concept (t → camera z), completely new world build. Realism at night = three levers: (1) buildings whose mass + emissive window detail reads architectural (window-atlas shader on instanced multi-block towers with silhouette variety), (2) a genuinely reflective wet roadway (three/addons `Reflector`, low-res target, roughness-distorted), (3) light that has volume (cone-billboard shafts + fog + rain interacting with sign light). Everything procedural/canvas — no external assets, keeping the design self-contained.

**Tech stack:** Three r185, GSAP/Lenis (unchanged), `Reflector` from `three/addons/objects/Reflector.js`, canvas-generated atlases. Verification: shot harness per task (`http://localhost:8123`, NEVER :8080).

**Keep from the current file (verified in recon):** rain streak InstancedMesh system, scroll→camera smoothing + station/panel/HUD wiring, FogExp2, bloom+`makeGradePass` chain, the documented instanceMatrix-in-ShaderMaterial pitfall & fix. **Scrap:** painted ground shader, flat box walls, bar-code sign shader.

---

### Task 1: Scaffold swap — keep chrome, empty the world

- [ ] Strip the old world build (walls/ground/signs) from the script block, keep: imports (+`Reflector`), renderer/scene/fog/camera, stations data + panel/HUD wiring, rain system, post chain, scroll rig, loop skeleton. Retune base mood: `scene.fog = new THREE.FogExp2('#0a0c14', 0.02)`, bloom (0.55, 0.6, 0.82).
- [ ] Verify: shot sweep renders (empty foggy night + rain + panels), zero console errors. Commit `feat(02-alley): scaffold for blade-runner rebuild — chrome kept, world emptied`.

### Task 2: Building system — window-atlas towers with real massing

The realism core. Night buildings live or die on their windows, not their walls.

- [ ] **Window atlas (canvas, 1024²):** paint a 12×24 grid of window cells; per cell randomly: dark (60%), warm-lit `#ffb46a` (25%), cool-lit `#9fc4ff` (10%), flicker-tagged (5%, animated via shader time + cell hash); each lit cell gets a 1–2px darker frame inset + occasional half-drawn blind (horizontal darker band); every 6th row a thicker slab line (floor plate). Also bake a matching 1-px-per-cell "emissive mask" second canvas for bloom-only sampling. Deterministic `prng`.
- [ ] **Tower geometry:** instanced boxes in 2–3 stacked tiers per tower (setbacks!) — one `InstancedMesh` per tier class (base 14–20 floors, mid 8–14, crown 4–8) + instanced rooftop clutter set (water tank cylinder, AC box, antenna spike — one InstancedMesh each, small). ~30 towers per street side over 300 m depth, height variance 25–90 m, small random yaw/lean (≤0.5°) so silhouettes never repeat.
- [ ] **Facade material:** `MeshStandardMaterial` + `onBeforeCompile`: sample window atlas by world-space UV (floor height 3.4 m → v; 4.5 m bay → u, offset per instance via instanceMatrix hash so no two towers share alignment), multiply into `emissive`; base albedo near-black concrete `#14161a`, roughness 0.9 with fresnel sheen toward grazing angles (wet air film). REMEMBER the repo pitfall: with raw ShaderMaterial you must multiply instanceMatrix manually — using MeshStandardMaterial+onBeforeCompile avoids it (USE_INSTANCING handles it).
- [ ] Verify shots at 3 depths: towers read as buildings (visible floors, varied silhouettes, believable window scatter — NOT a uniform LED grid). Iterate atlas parameters until it passes. Commit `feat(02-alley): window-atlas tower system with setback massing`.

### Task 3: The wet street — real reflections

- [ ] Road: `Reflector` plane (street width ~9 m × depth 320 m), `textureWidth/Height: 512` (1024 high tier), tinted `#0a0c10`. On top, an overlay plane (+0.005 m) with a puddle-mask shader: canvas mask (blurred blotches, tire lanes drier), `roughness` visual via UV-jittered sampling of… — simpler, proven approach: overlay is a `MeshStandardMaterial` asphalt texture (canvas: dark asphalt noise + lane markings + manhole circles) with alpha LOW in puddle areas (reflector shows through crisp) and HIGH on dry asphalt (reflector hidden) → binary-ish wet/dry read that sells rain without SSR. Slight normal-map ripple (canvas noise, scrolled slowly) on the overlay distorts edges.
- [ ] Curbs + sidewalks: low instanced boxes both sides, damp sheen (envMapIntensity 0.4, roughness 0.55).
- [ ] Verify: neon/sign light (Task 4 pending — use 2 temp colored PointLights) visibly mirrors in puddles; streaks elongate with the ripple normal. Commit `feat(02-alley): reflector roadway with puddle-mask asphalt overlay`.

### Task 4: Neon, signage, holograms

- [ ] **Neon sign generator:** canvas painter → texture: vertical/horizontal sign plates, glyph strips (katakana/kanji from a fixed string sampled per sign + latin brand fragments), 2px "tube" stroke with 8px glow, per-sign hue from a 5-color night palette (magenta, cyan, amber, red, teal). Emissive plane + slim dark frame box; ~35 signs stud the first 15 m of tower faces, sizes 1–6 m.
- [ ] **Animation:** shader uniform time → per-sign hash picks: steady / slow pulse / faulty flicker (hard random dropouts) / marquee (UV scroll). Faulty flicker on ~15%.
- [ ] **Light budget:** 8 PointLights total, assigned to the largest signs nearest the camera path, intensity animated with their sign; everything else lights via emissive+bloom only.
- [ ] **Holograms (2–3):** large half-transparent planes above the street — additive shader: scanlines + horizontal glitch offset bursts + chromatic split, content = canvas texture (a face silhouette / koi fish / rotating wireframe globe drawn procedurally). Slow idle rotation.
- [ ] Verify at night shots: street reads as a living neon canyon; reflections pick up sign colors (the money shot). Commit `feat(02-alley): neon signage system + holograms`.

### Task 5: Atmosphere — volume, steam, traffic

- [ ] **Volumetric shafts:** 6–10 cone billboards (additive, soft radial gradient texture, fresnel edge fade) hanging from sign clusters + one searchlight sweeping slowly from a rooftop; opacity tied to fog density so they read as rain-filled light.
- [ ] **Steam vents:** 4–5 sprite fountains (existing cloud-puff canvas technique from 23; instanced planes, upward drift + fade, lit-side tint from nearest sign color).
- [ ] **Air traffic:** 8–12 distant light streaks (thin emissive planes on lane splines high between towers, 2 lane heights, slow pulse) — depth cue + life.
- [ ] **Rain tuning:** keep the instanced streak system; add ground splash rings (small instanced quads at road level, 30–40 concurrent, scale+fade loop).
- [ ] Verify: atmosphere frames (mid-street) — shafts visible but not white-out; steam catches color. Commit `feat(02-alley): volumetric shafts, steam, splash rings, air traffic`.

### Task 6: Camera + stations + copy polish

- [ ] Replace the straight-line dolly with a gentle S-curve (CatmullRom, 6 points, lateral ±1.2 m, eye height 1.6→2.2 m) ending in a slow rise + pull-back on the street's hero tower (top-lit, largest holo). Aim curve leads into sign clusters per station.
- [ ] Rewrite the 4 station texts to the new identity (keep the HUD depth readout). Rename design title if needed (e.g. „Wet Circuit" stays fine — judgement call, keep unless copy fights it).
- [ ] Verify 6-position sweep against: every frame has a focal point (sign cluster / holo / tower); horizon never visible (canyon feel); text panels don't cover focal points. 2–4 iteration rounds expected. Commit `feat(02-alley): s-curve dolly + station copy`.

### Task 7: Performance tiers + final verification + docs

- [ ] Port the `TIERS`/`guessTier`/governor pattern from `2026-07-05-house-adaptive-performance.md` (copy, adjust knobs: reflector res 1024/512/off→dark static plane, rain count, holo on/off at low, PointLight count 8/5/3, dpr caps). Context-loss hatch identical.
- [ ] Full sweep (8 positions) + FPS note vs. old 02 baseline (capture BEFORE Task 1 in a `house-…`-style baseline run — add as Step 0 if not yet done), portrait spot-check, poster regen (`POSTER_BASE=http://localhost:8123/designs/ bash tools/poster.sh 02-cyberpunk-alley`), PLAN.md log entry, Outcome section here. Commit `docs(02-alley): log blade-runner rebuild outcome + poster`.

**Judgement points:** window-atlas parameters (Task 2), puddle-mask balance (Task 3), sign density/palette (Task 4), shaft opacity (Task 5), camera framing (Task 6) — all iterate via shot harness with explicit VIEW steps. SwiftShader caveat: Reflector renders the scene twice — expect very low harness FPS; judge composition only, real perf on Nico's GPU.
