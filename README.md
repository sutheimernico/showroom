# Showroom

A lab of standalone, scroll-driven 3D web designs. Each piece is a single folder of plain HTML + ES modules
(no build step) that should make a non-technical viewer ask "how is this a website?".

## Pieces

| # | Title | Idea |
|---|-------|------|
| 01 | Lumen | A house walkthrough defined by light (PBR textures, photoscanned trees) |
| 02 | Wet Circuit | Flight through a rain-soaked cyberpunk alley |
| 03 | Fall Outward | A journey through the solar system |
| 08 | Coherence | 524,288 GPU particles finding shape (WebGPU/TSL, WebGL2 fallback) |
| 21 | To the Core | A descent through the Earth |
| 23 | Apex | Four hundred kilometres down (work in progress, backdrops are procedural placeholders) |

Posters live in `assets/posters/`. The gallery is `index.html`.

## Run it

```bash
./serve.sh          # serves the repo on http://localhost:8080
./serve.sh 9000     # custom port
```

Open the gallery and click a card. Needs a browser with WebGL2 (WebGPU is used by `08` where available).
Any static file server works; ES modules do not load from `file://`.

## Large model buffer (not committed)

`designs/01-house-walkthrough` uses the Poly Haven `island_tree_02` photoscan. Its 40 MB `.bin` buffer is
excluded from the repo (and gitignored); without it the trees are missing and the browser console shows a
load error, everything else renders. Fetch it once:

```bash
bash tools/fetch-models.sh
```

## Stack

- Three.js r185 (WebGLRenderer + GLSL `ShaderMaterial`; WebGPU/TSL for `08`), post-processing from `three/addons`
- GSAP 3 + ScrollTrigger for choreography, Lenis for smooth scroll
- Libraries come from a CDN import map (jsDelivr); shared helpers in `shared/`

## Dev tooling (optional)

`tools/` holds a Playwright screenshot harness (`shot.sh`, `poster.sh`) used to verify pieces headlessly and
produce posters, plus `higgsfield-gen.mjs` for generating AI backdrops (needs `HF_API_KEY` / `HF_API_SECRET` in a local `.env`).

```bash
cd tools && npm install
bash tools/shot.sh http://localhost:8080/designs/01-house-walkthrough/ 01-house
```

`PROJECT.md` states the quality bar, `PLAN.md` tracks concepts and progress, `LOOP.md` / `AUTOPILOT_LOG.md`
document the autonomous build loop used to develop this.

## Licensing

- Code: MIT, see `LICENSE`.
- Third-party 3D models, HDRIs and textures are CC0 (mainly [Poly Haven](https://polyhaven.com)); sources are
  listed in `designs/*/models/SOURCES.md` and `PROJECT.md`.
- Posters and backdrops generated with AI tools are the author's own output.
