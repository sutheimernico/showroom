# Showroom — Jaw-Dropping 3D Web Designs

A lab of ~20 standalone, deeply impressive 3D / scroll-driven website designs for the portfolio.
Each one should make a non-technical viewer ask "how is this a website?".

## The bar
Every design must clear all of these or it isn't done:
- A clear, single **"wow" moment** a layperson notices in the first 5 seconds.
- **Scroll is the verb**: a normalized 0→1 scroll value drives camera / particles / shader uniforms.
- **Cinematic finish**: post-processing (bloom / DOF / fog / chromatic aberration / grain) — never a raw flat render.
- **~60 fps** on a normal laptop; cap `pixelRatio` at 2; pause the render loop when the tab is hidden.
- **Self-contained**: one folder, opens from the gallery, no build step.
- Doesn't look templated / AI-generated (see Design direction).

## Constraints
- **Local-first.** Viewed via a local server (`./serve.sh` → http://localhost:8080). Public hosting is a later, separate step.
- **No build.** Plain HTML + ES modules via CDN import map. TypeScript only if a design truly needs it (it shouldn't).
- **Each design is independent.** Shared helpers live in `shared/`, but a design must run on its own.
- No secrets, no tracking, no external calls beyond CDN libs + CC0 assets.

## Tech stack (verified June 2026)
- **Three.js r185** (`0.185.0`) — WebGLRenderer + GLSL `ShaderMaterial` (not WebGPU; broadest support, most tutorials).
- **GSAP 3.13 + ScrollTrigger** — the choreography brain (now fully free).
- **Lenis 1.3** — smooth scroll synced into one rAF loop with GSAP.
- Loaders / post from `three/addons`: `GLTFLoader`, `DRACOLoader`, `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `BokehPass`.
- CDN: jsDelivr. The import map + skeleton live in `shared/` (see `shared/stack.html`).

## The wow recipe (condensed from research)
1. One normalized 0→1 progress drives everything → scrubbable, deterministic.
2. Author the camera path (`CatmullRomCurve3` / GSAP keyframes), bind to scroll in one line.
3. Bake offline, replay cheap: matcaps, baked shadows/AO, vertex-animation textures.
4. Post-processing sells the look — budget for it first.
5. Fake the lighting (matcaps + baked shadows) to free the frame budget.
6. Z-translate + fog = a flythrough with no hand-animated path (cheapest entry to "scroll through a space").
7. Two ways to weave 3D into a page: scripted camera path, or static camera + project DOM rects into world space.
8. Render scenes to FBOs and composite for seamless multi-scene transitions.
9. Instancing / `BatchedMesh` + data-in-a-texture for anything repeated.
10. Mobile survival = asset pipeline: Draco GLB, KTX2/WebP textures, 2K caps, pixelRatio cap.

## Design direction (anti-"AI look")
Per design, before coding: pick a 4–6 color token system, a deliberate display/body type pairing,
a layout concept, and ONE signature element. Invoke the `frontend-design` skill each time.
Avoid the three generic AI looks: cream+serif+terracotta; near-black+acid-green; broadsheet hairlines.

## Layout
```
showroom/
  PROJECT.md          # this file — vision, bar, stack
  PLAN.md             # the 20 concepts, status, loop rules
  index.html          # gallery landing → links every design
  serve.sh            # start local server on :8080
  shared/             # stack skeleton, helpers, base css
  assets/             # CC0 models / hdri / textures
  designs/NN-slug/    # one folder per design, index.html inside
  tools/              # playwright screenshot harness (dev only)
```

## How to view
`./serve.sh`, then open http://localhost:8080 — the gallery. Each card opens a design.

## Asset sources (all CC0 / permissive)
Poly Haven (models + HDRI), Quaternius, Kenney, Poly Pizza, Khronos glTF-Sample-Assets.
Check per-model license; prefer CC0. Store under `assets/`, keep filenames kebab-case.
