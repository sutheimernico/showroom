# Showroom — Build Plan & Progress

Single source of truth for what's built, what's next, and how the autonomous loop runs.

## Status legend
☐ todo · ◐ in progress · ☑ done (clears the bar) · ✗ parked / replaced

## Benchmark phase (build first → get feedback → THEN loop the rest)
Three deliberately different pieces, to calibrate quality & direction:
1. ☑ `01-house-walkthrough` — orbit camera around a readable house, day→night (origin vision)
2. ☑ `03-solar-journey` — Sun → each planet → black hole (user-requested 2026-06-29)
3. ☑ `21-earth-descent` — satellite view → cross-section cutaway through Earth's layers to the core (user-requested 2026-06-29)
Note: `06-product-reveal` and `08-particle-morph` move to the loop phase — the user swapped the 3rd
benchmark for the Earth dive. Three diverse pieces (warm interior / cosmic / planetary science) still
calibrate direction before the autonomous loop.

## The 20 concepts
| #  | slug | world | core effect & technique | vibe | status |
|----|------|-------|-------------------------|------|--------|
| 01 | house-walkthrough | House | orbit camera, day→night cycle · path + interior + bloom | warm cinematic | ☑ |
| 02 | cyberpunk-alley | Cyberpunk alley | endless neon-rain flight · looping tiles + heavy post | dark neon | ☑ |
| 03 | solar-journey | Solar system | overview → zoom each planet → black hole · shaders + bloom | dark cosmic | ☑ |
| 04 | deep-descent | Deep sea | surface → bioluminescent abyss · god rays + fog | abyss | ☐ |
| 05 | cathedral | Cathedral | reverent flight, light shafts · volumetric + dust | chiaroscuro | ☐ |
| 06 | product-reveal | Product | object rotates & explodes · PBR + DOF | bright premium | ☐ |
| 07 | exploded-gadget | Gadget | device bursts into parts · exploded-view | bright editorial | ☐ |
| 08 | particle-morph | Particles | point cloud morphs shapes · WebGPU/TSL compute (auto WebGL2 fallback) | dark neon | ☑ |
| 09 | raymarch-fractal | Fractal | endless SDF tunnel · fragment raymarching | psychedelic | ☐ |
| 10 | glass-blob | Glass character | refractive blob reacts to mouse · refraction shader | clean dark | ☐ |
| 11 | aurora-hero | Aurora | animated silk/aurora bg + type · noise gradient | editorial | ☐ |
| 12 | webgl-gallery | Photo gallery | images morph with distortion · plane shaders | editorial | ☐ |
| 13 | kinetic-type | Typography | extruded type rotates/shatters · TextGeometry + GSAP | bold mono | ☐ |
| 14 | depth-tunnel | Z-tunnel | projects in fog along Z · Z-translate + fog | minimal dark | ☐ |
| 15 | data-globe | Data globe | dot-globe live data · data-in-texture + instancing | dark tech | ☐ |
| 16 | forest-walk | Forest | instanced forest, god rays, day→night · instancing | organic golden | ☐ |
| 17 | anatomy-zoom | Anatomy | skin → organs → DNA · layered + clipping | clean medical | ☐ |
| 18 | black-hole | Black hole | gravitational lensing + disk · lensing shader | dark dramatic | ☐ |
| 19 | fluid-sim | Fluid | interactive smoke/fluid · navier-stokes shader | hypnotic | ☐ |
| 20 | art-gallery | Art gallery | camera through 3D gallery, perfect light · path | bright editorial | ☐ |
| 21 | earth-descent | Earth interior | satellite → cross-section cutaway: crust → mantle → outer/inner core · clip-plane + cap shader + bloom | realistic awe | ☑ |
| 22 | goal-strike | Football stadium | scroll drives a ball curling into the net · path + net ripple + floodlight bloom + slow-mo | floodlit night, dynamic | ☐ |
| 23 | apex-descent | Megacity | orbit→street fall · hybrid: AI matte stages (Higgsfield Soul) + parallax towers + whiteout handoffs | photoreal neon | ◐ |

Reserve (swap in if one fails to land): `city-build`, `terrain-flight`, `glass-mountain`.

User-requested concepts (2026-06-29): `21-earth-descent` (build now), `22-goal-strike` (creative phase, not in first three).

## Loop mechanic (per design)
1. **Direct** — invoke `frontend-design`: color tokens, type pairing, layout, ONE signature element.
2. **Build** — `designs/NN-slug/index.html` from the shared stack skeleton.
3. **Verify (visual)** — `tools/shot.mjs` renders screenshots at scroll 0 / .25 / .5 / .75 / 1; check:
   - no console errors / no WebGL context loss
   - the wow moment is actually visible; framing good; no ugly/empty frames
   - colors & composition match the design direction
4. **Iterate** until it clears the bar (PROJECT.md). Re-shoot after each fix.
5. **Register** — add a card to `index.html`; set status ☑ here; append a one-line note to the log.
6. Next design.

## Quality gates (every design)
- Zero console errors; no WebGL context loss.
- Holds ~60 fps (pixelRatio ≤ 2; pause rAF when tab hidden).
- Has post-processing.
- `prefers-reduced-motion` handled (reduce/disable motion, stay legible).
- Looks intentional, not templated.

## Progress log
- 2026-06-29 — project scaffolded; research done; benchmark phase started.
- 2026-06-29 — `01-house-walkthrough` cleared the bar (orbit camera, golden-hour→night, bloom + dust).
- 2026-06-29 — `03-solar-journey` cleared the bar. Key fixes: frame-rate-independent camera smoothing
  (`1-exp(-k·dt)`) so headless screenshots settle like 60fps; bloom threshold 0.55→0.8 + strength 0.9→0.7
  to stop gas-giant blowout; left scrim for panel legibility over bright bodies; black-hole finale reframed
  to a 3/4 near-flat accretion disk with photon ring (the Interstellar look). Shot harness gained `SHOT_POS`.
- 2026-06-29 — user added two concepts: `21-earth-descent` (building now), `22-goal-strike` (creative phase).
- 2026-06-29 — `21-earth-descent` cleared the bar. Big pivot: the original "dive through dissolving shells"
  reproduced a flat white-wall blowout (camera inside a shell sees the far wall as a white wash). Re-architected
  to a **cross-section cutaway** — camera stays outside, the near hemisphere is clipped away via a manual
  `if (vW.z > uClip) discard;` (avoids Three's clipping-chunk plumbing), and a flat `CircleGeometry` cap shader
  paints concentric layer bands (crust→mantle→outer/inner core) on the cut face. Key fixes: steep 3/4 camera
  (~43°) so the cut disc foreshortens into an ellipse + a curved blue fresnel peel ring reads the shell as 3D
  (a full hemisphere cut at z=0 reads FLAT because the disc silhouette equals the sphere silhouette); partial
  cut timed so a "half-Earth / half-core" hero lands on the Crust station; emissive ramp kept LOW + bloom
  threshold 0.8 so only the small core blooms (no white-out); side-lit sun (terminator on the marble) +
  capped day diffuse so the orbit/atmosphere frames don't bloom-blow the subsolar point; atmosphere pulled to
  R·1.055 + day-weighted soft limb to kill a soap-bubble double ring. Depth carried by a km/temperature gauge +
  accent shift blue→orange→white, not by diving into the bright center.
- 2026-06-29 — **photoreal pass** across all three benchmarks: procedural surfaces → real textures.
  `21-earth-descent`: NASA Blue/Black Marble + topography (public domain, no attribution).
  `03-solar-journey`: 8 planet albedo maps + Saturn ring color/alpha from Solar System Scope (CC BY 4.0 —
  requires a visible credit since hosted → added to the gallery footer; Sun + black hole stay procedural by
  design). `01-house-walkthrough`: Poly Haven CC0 PBR (diff/nor_gl/rough) on the box geometry — `pbr(name,rx,ry)`
  helper tiles via per-material `repeat` tuned to each face's world size; warm albedo `color` re-added on the
  neutral plaster/concrete maps so golden hour keeps its honey cast; envIntensity 0.32→0.4; `LoadingManager`
  gates the loader overlay on texture decode. Each texture dir has a `SOURCES.md`. Posters regenerated.
- 2026-06-29 — **realism pass on `01-house-walkthrough`** (user mandate: "das Haus noch nicht so clean und
  dort auch der Hintergrund … nicht schön — das kriegst du alles noch geiler hin"). Two problems fixed:
  - *Ugly flat background* → **sky-dome**: a `SphereGeometry(180, …)` with `BackSide`, `depthWrite:false`,
    `fog:false`, `renderOrder:-1`, pinned to the camera each frame (`sky.position.copy(camera.position)`),
    `scene.background=null`. A light ShaderMaterial paints a vertical gradient (`mix(uHorizon,uZenith,pow(h,.5))`),
    a sun glow (`pow(sd,6)*.5 + pow(sd,90)*1.1`), a horizon sliver, and procedural hash-stars that fade in at
    night. Radius 180 < camera.far 200. The `stops` keyframes now drive sky uniforms (hor/zen/stars) alongside
    fog/sun/ambient, so the full arc reads golden hour → sunset → magenta blue-hour → deep-blue starry night.
  - *Night frame was the weakest moment* → **lantern glow**: the night payoff for "Lumen" is the house lighting
    up from within. Interior `warmWall`/`floor` get `emissive` (creamy 2700K amber `#ffb472`/`#ffa050`, tuned to
    the PointLight colour so it reads as warm light, not terracotta) at `emissiveIntensity:0` by day; `applyDay()`
    ramps it via the interior-light factor `pt` (`*0.42`/`*0.30`) and pushes the 4 PointLights to `pt*10` (was
    `*3.2` — physically too weak to fill the room). UnrealBloom turns the self-glowing surfaces into a lantern
    seen through the glass facade. Bloom strength `0.18 + pt*0.55`. The night frame went from dimmest to hero;
    captions ("keeps its own light — the house answers from within") now match the visual.
  - *Faceted lollipop trees clashed with the new realistic sky/PBR* → **organic grove**: crowns are now
    `IcosahedronGeometry(r, 4)` displaced by a sum of low-freq sines (deterministic, smooth-shaded via
    `computeVertexNormals`, no facets) with a baked vertical vertex-colour gradient (dark underside → sun-lit
    top, `#1f2718`→`#73813f`) faking AO + skylight, a subtle per-tree hue shift, 5 overlapping lumps per tree
    and a tapered, slightly-leaning trunk. Pure CPU geometry, no new shader — SwiftShader-safe. Poster regenerated.
    Supersedes the earlier "intentionally dim dusk piece" deferral — `01` is now a full day→night arc.
- 2026-07-01/02 — `02-cyberpunk-alley` cleared the bar (endless neon-rain flight, station panels, HUD depth
  readout, Rajdhani/JetBrains Mono pairing). Found and fixed a real bug during visual verification, worth
  recording: the alley walls (`THREE.InstancedMesh` with a fully custom `ShaderMaterial`) never multiplied
  vertex `position`/`normal` by `instanceMatrix` in the vertex shader — Three.js does NOT auto-apply
  `instanceMatrix` for raw `ShaderMaterial` the way it does for built-in materials, so all 26 building
  instances per side silently collapsed onto one block-sized shape at the shared group origin. It rendered
  (no console error) and looked like a plausible bloom-blown "wet reflection blob" at first glance — only
  caught by isolating systems one at a time (hide ground / hide walls / solid-red material override) and
  noticing that moving the loop's `z` offset had zero visual effect, which a correctly-instanced mesh could
  never do. Fixed by transforming `position`/`normal` through `instanceMatrix` before `modelMatrix` in the
  vertex shader. Once real per-instance buildings appeared, the window-grid density/brightness needed a
  second pass (was tuned against the collapsed single-block case, so it read as a solid glowing wall once
  correctly tiled across 26 instances) — window-lit threshold `0.4→0.86`, fresnel/window intensities roughly
  halved. Also fixed: three ground-reflection lanes converging near the camera's opening position blew past
  white on the first frame (hard-clamped `refl` + widened the near-camera falloff); two station headlines
  double-exposing during the mid-scroll crossfade (steep opacity falloff with a hard zero past a threshold,
  replacing an unbounded linear one); rain was sub-pixel/invisible at flight distance (switched from
  `THREE.Points` sprites to additive-blended instanced streak planes). Added missing `prefers-reduced-motion`
  handling (PROJECT.md quality gate) — handheld camera sway now holds still under reduced motion. Removed
  dead code (`smoother`, unused since an earlier pass). `tools/poster.mjs` gained the `02` job.
- 2026-07-02 — **quality pass** across all 4 live pieces (antialiasing, post-processing dedup,
  frame-rate-independent camera, resource lifecycle, real fps measurement):
  - *Real MSAA*: `antialias:true` on the renderer was inert — every design routes through
    `EffectComposer`, whose default render target carries no multisampling (confirmed by reading
    three r185's own `EffectComposer` source). `shared/lib.js` gained `makeComposer(renderer)`,
    which hands the composer a `WebGLRenderTarget({ samples: 4, type: HalfFloatType })` on WebGL2 —
    three's own documented recipe for composer MSAA. All 4 designs switched to it.
    **Load-bearing caveat, found by actually measuring rather than assuming**: under SwiftShader
    (the software GL rasterizer headless Chromium always uses, including this repo's own
    `shot.mjs`), a multisampled render target is not just slower but pathological — a trivial
    isolated test scene went from ~12ms/frame (samples:0) to ~105ms/frame (samples:4, 5 frames) and
    to an outright non-terminating render queue at 60 continuous frames; on the real production
    scenes it hung `page.screenshot()` outright (2-minute timeout, no error, no completion).
    `makeComposer()` now detects software rasterizers via `WEBGL_debug_renderer_info` /
    `UNMASKED_RENDERER_WEBGL` and falls back to `samples:0` there — real GPU hardware gets genuine
    MSAA, this harness never does. **Consequence: no before/after AA screenshot diff could be
    produced from this sandbox** — shot.mjs always takes the guarded (non-MSAA) branch here, and a
    forced-on synthetic test showed SwiftShader's software rasterizer already smooths single-sample
    edges at the pixel level (identical edge-pixel values with samples:0 vs samples:4 in a
    controlled A/B), so there was nothing to diff even when forcing the MSAA path on. The fix is
    verified correct by code path (WebGL2 + non-software → samples:4, confirmed via
    `renderer.capabilities.isWebGL2` and the UA string check) and by the documented three.js
    pattern, not by an eyeballed screenshot comparison.
  - *Post-processing dedup*: the near-identical chromatic-aberration/vignette/grain `ShaderPass`
    duplicated across `02`/`03`/`21` (each with slightly different `uAberr`/vignette-min/grain
    constants, `21` additionally driving a heat-tint + heat-tightened vignette via `uHeat`) is now
    one `makeGradePass({ aberration, vignetteMin, grain, heat })` factory in `shared/lib.js`. Each
    design passes its existing tuned constants; the generated GLSL is byte-identical to what was
    inlined before, so screenshots are unchanged (mod the AA guard above).
  - *Frame-rate-independent camera lerp*: `01-house-walkthrough`'s `camera.position.lerp(_p, 0.12)`
    applied the same fixed factor every frame regardless of `dt`, so — like the bug `03` already
    documented and fixed — it settled slower in wall-clock time at low frame rates than at 60fps.
    Switched to `1 - Math.exp(-7.7 * dt)` (k=7.7 chosen so behavior at 60fps is unchanged:
    `1-exp(-7.7/60)≈0.12`), matching `03`'s established pattern.
  - *Resource lifecycle*: PLAN.md's "no WebGL context loss" gate was aspirational — nothing
    actually handled it. New `attachLifecycle(renderer, scene, composer)` in `shared/lib.js`:
    disposes scene geometries/materials/textures + the composer/renderer on `pagehide`, calls
    `preventDefault()` on `webglcontextlost` (without it the browser kills the context
    permanently), and reloads the page on `webglcontextrestored`. Re-uploading every bespoke
    scene's GPU state by hand isn't worth it for one-off showpieces, so recovery is "reload", not
    in-place restore. Wired into all 4 designs.
  - *Real fps measurement*: `tools/shot.mjs` gained `measureFPS()` — after the screenshot sweep it
    samples real rAF-to-rAF deltas for ~3.5s while continuously driving `__scrollTo` across 0→1
    (so the number includes scroll/ScrollTrigger/Lenis overhead, not just an idle frame), and
    prints avg + a 5th-percentile-delta "low" fps. The console line explicitly says this is a
    SwiftShader software-render number, not GPU-representative, and it should be read as a lower
    bound / regression signal only. **Numbers from this session are further degraded by heavy host
    contention** (`uptime` load average 15–30 on a 16-core box throughout, from unrelated
    concurrent processes) — recorded avg fps ranged ~0.9–2.5 across the 4 pieces, all zero console
    errors. Treat the low absolute numbers as a contended-machine artifact, not a piece-to-piece
    quality signal; re-run `SHOT_FPS_MS=5000 bash tools/shot.sh <url> <slug>` on a quiet machine
    for a trustworthy comparative baseline.
- 2026-07-02 — **`08-particle-morph` ("Coherence") cleared the bar as the repo's first WebGPU/TSL
  piece.** Up to 524,288 GPU-simulated particles ease from a noise cloud ("Dust") into an analytic
  sphere, torus and double helix as you scroll, via `THREE.WebGPURenderer` + TSL compute
  (`instancedArray`/`Fn`/`renderer.compute()`), a `THREE.RenderPipeline` post chain (bloom →
  tonemap/colorspace → chromatic aberration → a hand-written TSL vignette/grain node matching
  `shared/lib.js`'s `makeGradePass` look), and the repo's usual GSAP/Lenis scroll rig. Chakra
  Petch/Fira Code pairing, violet→cyan particle gradient, a live HUD diagnostic honestly reporting
  the active particle count and GPU backend. Three real bugs found during verification:
  - `three.webgpu.js` (r185) is **not** a superset of `three.module.js` — it drops legacy
    WebGL-only exports like `UniformsUtils`. Pointing this design's `"three"` import map entry at
    the webgpu build broke `shared/lib.js`'s `EffectComposer`/`ShaderPass` imports outright
    ("does not provide an export named 'UniformsUtils'"). Fixed by keeping `"three"` →
    `three.module.js` (same as the other 3 designs) and adding `"three/webgpu"` as a separate
    import map entry used only by this design's own renderer/material code; `shared/lib.js`'s
    renderer-agnostic helpers (gsap/ScrollTrigger/scroll/loop/resize/loader/clamp) needed zero
    changes and are reused unmodified.
  - `chromaticAberration(node, strength, center, scale)`'s own JSDoc documents `center=null` as
    "uses screen center (0.5, 0.5)", but the addon's own official three.js example never actually
    exercises that path (it always passes an explicit `Vector2`) — passing `null` here threw
    `THREE.TSL: TypeError: Cannot read properties of null (reading 'build')`. Fixed by passing
    `new THREE.Vector2(0.5, 0.5)` explicitly; the documented default isn't safe in practice.
  - Compute on the WebGL2 fallback is real (three's `WebGLBackend` emulates it via transform
    feedback — confirmed by reading the source, not assumed) but under SwiftShader it's slow
    enough that 524,288 particles made `shot.mjs`'s screenshot capture take minutes per frame.
    Added a same-technique `isSoftwareRasterizer()` check (mirrors `makeComposer`'s guard) that
    drops the count to 32,768 on a detected software rasterizer; real WebGPU or a real GPU-backed
    WebGL2 fallback still gets the full 524,288. `tools/shot.mjs`'s own fps sampler hit a related
    edge case here (see the `measureFPS` fix above) — even at 32,768 particles, this session's
    combination of SwiftShader + heavy host contention pushed rendering to well under 1fps
    (unmeasurable — fewer than one full frame in a 3.5s sample window).
  **Honesty note per the task brief**: this sandbox's headless Chromium has no `navigator.gpu` —
  `shot.mjs` only ever exercises the WebGL2 fallback path, confirmed live in the piece's own HUD
  ("BACKEND · WebGL2 (fallback)"), never real WebGPU. The compute shader graph, `RenderPipeline`
  TSL post-processing, and reduced-motion handling are shared code paths with the real-WebGPU
  route — only backend *selection* is untestable here, not the rendering logic itself. Registered
  in `index.html`'s live gallery and `tools/poster.mjs`.
  **Not yet 10/10** — worth a follow-up pass: at this additive-sprite density the torus/helix
  stations read more as a bright converging particle mass than a crisply legible ring/coil (panel
  copy names the shape; the pure-visual read could still be sharper — lower density, a bigger
  hole-to-body ratio, or replacing raw additive dots with a fresnel/surface-shaded look would help).
- 2026-07-03 — `23-apex-descent` ("Apex") built as the repo's first **hybrid AI-asset + realtime**
  piece (new benchmark direction after Nico's "Higgsfield-level" mandate; spec:
  `docs/superpowers/specs/2026-07-03-apex-descent-design.md`): one scroll = one uninterrupted fall
  from 400 km orbit to a 4 m neon street across five photoreal backdrop stages, with realtime
  parallax tower fields (02's instanceMatrix-in-ShaderMaterial pattern), whiteout cloud handoffs
  masking the stage swaps, 02's instanced rain streaks at street level, and a log-scale altitude
  rail (400 KM → 4 M) as the signature element. Space Grotesk/IBM Plex Mono pairing.
  **Backdrops are procedural placeholders for now**: the Higgsfield Cloud API integration is done
  and verified (`tools/higgsfield-gen.mjs` — protocol read out of the official Python SDK source:
  `POST /v1/text2image/soul` with a `{params:{...}}` body, poll `status_url` until
  completed/failed/nsfw/canceled; auth `Key $HF_API_KEY:$HF_API_SECRET` from `.env`, validated 200
  on the free `/v1/motions` endpoint) but generation answered **`403 Not enough credits`** — the
  API wallet is empty and topping up is Nico's move. `assets/apex/manifest.json` gates which stills
  exist so the design never probes missing files (resource 404s are console errors = hard gate
  violation); the gen script maintains the manifest, so `top up → one command per stage` drops
  stills in with zero code change. Status **◐ not ☑** deliberately: objective gates pass (zero
  console errors, bloom+grade post chain, reduced-motion, lifecycle, pixelRatio cap) but the wow
  bar with placeholder backdrops is Nico's call (LOOP.md rule 7). Three real bugs found by looking
  at the screenshots, all with the same lesson (verify at software-render fps, not just at 60):
  (1) ACES tone mapping crushed the sRGB-authored backdrop canvases to near-black →
  `toneMapped:false` on backdrop planes; (2) `scrub:1`'s time-based catch-up tween never settles
  within shot.mjs's 1100 ms post-scroll wait at ~1–2 fps → `scrub:true` (Lenis already smooths user
  scroll; the double smoothing was redundant); (3) the panels' CSS `transition: opacity .5s` lagged
  the visible panel one full station behind the (transition-less) HUD in screenshots → removed, the
  per-frame scroll-driven opacity is already smooth. `tools/poster.mjs` gained `POSTER_BASE` /
  `POSTER_DSF` env overrides (:8080 was occupied by an unrelated service on this host; DSF 2's
  3200×2000 buffer pushed SwiftShader past the screenshot timeout under load average ~9). Poster =
  street stage. Note: PROJECT.md's `shared/stack.html` reference is stale — the file never existed;
  the de-facto skeleton is 02/21.
- 2026-07-03 — **cinematic pass on `03-solar-journey`** (Nico's verdict on the placeholder-backed
  apex: "nicht geil" → redirected the wow-budget to the solar system). Diagnosis from fresh shots:
  the piece read as a lifeless bead chain — camera too far at every station, dead-black transits,
  faint atmospheres, the Sun never staged as a light source, and the overview (the 5-second first
  impression) weakest of all. Changes: (1) **camera direction** — every body now dominates ~2/3 of
  frame height (rocky ~2.9r, gas 3.4r, Saturn 4.7r for ring clearance), aim offset right of the
  panel, terminator running through frame; overview re-framed low and close with the Sun large on
  the left. (2) **Earth is now the money shot**: NASA Black Marble city lights on the night side +
  drifting cloud layer (textures reused from 21, provenance in SOURCES.md) + blue scatter rim.
  Cloud density lives in the PNG's **alpha** channel (RGB is flat white) and must load as
  NoColorSpace — sampling `.r`/sRGB rendered blocky tiles. (3) Sun: corona 1.35r→1.85r + lens-flare
  sprite (faded out past seg 2.3, frustum-culled behind the camera later); surface emissive
  1.5→1.28 with a warmer `hot` — equal R+G overdrive clipped to a chartreuse rim under bloom.
  (4) Fall-feel: 1 500 additive dust points along the flight path give the transits parallax;
  orbit rings anchor the overview as a *system* (faded before close-ups so they can't slice
  through planets). (5) Atmosphere shells: brighter day limb, night limb damped
  (`0.22+1.25*lit`) — a uniform halo read as a sticker ring. (6) Determinism fixes ported from 23:
  `scrub:true`, no CSS panel transition, and a camera **snap on per-frame t-jumps >0.05**
  (programmatic scrolls only) — `loop()`'s dt clamp caps the exp smoothing far below real time at
  ~1fps, so harness shots used to capture the camera mid-flight between stations (the "tiny
  planets" in the old shots were transits, not framing). Poster switched to the Earth frame
  (pos 0.4). Zero console errors across sweeps.
  **Correction after Nico tested on real hardware ("komplett verbuggt")** — three bugs static
  SwiftShader shots could not show: (1) the camera snap was a t-delta heuristic (>0.05/frame) and
  ALSO fired on fast real scrolling (scrollbar drags, hard flicks) → camera juddered through
  stations; replaced by wrapping `window.__scrollTo` so only the harness's programmatic jumps
  snap. (2) at cam 2.7r + corona 1.85r the straight lerp path Sol→Mercury clipped through the
  corona shell (min path distance 25.1 < shell 25.9) → full-screen orange wash; now cam 3.0r +
  corona 1.7r (clearance 27.3 vs 23.8). (3) the new dust points had no near-camera dead zone —
  grains crossing the lens flashed as bright blobs; PointsMaterial replaced with a small shader
  that fades points closer than 2.5–10 units. Lesson: static screenshots verify framing, not
  scroll *feel* — motion-path bugs (judder, path-through-geometry, near-lens particles) need an
  interactive check or an explicit path-clearance calculation.
  **Sun rework after "die ist nicht so clean"**: the photosphere no longer relies on overdriven
  RGB + bloom (which flip-flops between a clipped white disc and a matte beige ball — 6 parameter
  iterations proved there is no sweet spot on that axis). Now: limb-darkened yellow-orange disc
  with fine low-contrast granulation + sparse sunspots kept BELOW the bloom threshold, and the hot
  centre comes from an additive radial glow sprite OVER the disc (the standard WebGL-sun trick) —
  glows without clipping, granulation stays visible underneath. The lens-flare sprite is now
  distance-only (faded out by seg 0.95): at the Sol close-up it sat right on the disc and
  repainted the centre as a white pillow + streak. Bloom strength ramps 0.45→0.7 across the inner
  system.
  **"Schwarze Flecken" (giant black rectangles) on Nico's real GPU — NaN class, hardened.**
  Neither SwiftShader nor llvmpipe (probed via /dev/dxg → still software) reproduces it, so this
  was diagnosed by UB audit, not screenshots. Real defects found and fixed in 03: (1) corona and
  atmosphere computed `pow(1.0-abs(dot(N,V)), x)` UNCLAMPED — interpolation pushes |dot| past 1,
  and `pow(negative, non-integer)` is NaN in GLSL; one NaN texel at the (huge, always-on-screen)
  corona rim smears across UnrealBloom's mip chain into screen-scale black rectangles on real
  drivers. (2) `atan(0,0)` at planet-texture poles → NaN UVs. (3) star/dust `gl_PointSize =
  k/distance` unclamped → infinite/negative sizes explode into NaN quads on ANGLE/D3D11 (fixed
  previous commit). Defence-in-depth: a NaN-scrub ShaderPass now sits between RenderPass and
  bloom (`c != c → 0`, clamp 0..64) so any missed source dies before the mip chain; plus a
  `?nomsaa` diagnostic flag in `shared/lib.js`. NOTE: the same unclamped-pow pattern exists in
  01/02/21's fresnel shaders — if Nico reports black blocks there, apply the same clamp + scrub.
- 2026-07-03 — **realism expansion on `03-solar-journey`** (Nico: "deutlich realistischer, Monde,
  sau beeindruckend"). (1) **Photo-based sun**: Solar System Scope sun map (CC BY 4.0, existing
  footer credit covers it) replaces the procedural photosphere — two counter-drifting fbm-warped
  samples cross-fade so the surface visibly boils without tiling; limb darkening, chromosphere
  rim, streaked corona and glow sprite stay analytic on top. Procedural fbm alone topped out at
  "lava lamp" after ~8 tuning rounds — texture was the step change. (2) **Moon systems** (PHYS
  table: tilt/spin/moons per body): Luna with the real 2k moon map (fixed orbit phase 5.8 so it
  sits in shot at the Earth station), Phobos/Deimos, the four Galilean moons (art-scaled but
  honest ratios, Ganymede largest), Titan outside the rings, retrograde + steeply inclined
  Triton — all orbiting on tilted pivots (fbm-shaded tinted rock via a small moonFrag; Luna uses
  planetFrag). (3) **Axial tilts on the whole group** (spin axis + rings + moon orbits tilt
  together; Uranus 1.71 rad) and per-body spin rates, Venus retrograde. (4) **Saturn's globe
  shadow across the rings** (analytic ray-past-sphere test in the ring shader — the strongest
  single Saturn realism cue). (5) **Earth ocean sun-glint** via 21's earth_spec.jpg, masked by
  clouds. (6) **Milky Way sky sphere** (2k pano, dimmed 0x6e6e84) behind the point starfield.
  Zero console errors; poster re-rendered (Earth + Luna).
  Second wave ("noch krasser"): (7) **asteroid belt fly-through** — 2 600 instanced rocks on a
  ring R 127–143 that the camera path crosses at x≈135, so the Mars→Jupiter transit passes
  THROUGH the belt (instanceMatrix applied manually in the ShaderMaterial, 02's lesson);
  (8) **comet** on an eccentric inclined orbit with two physically-honest tails (dust curved
  along negative velocity, ion straight anti-sunward, both point-size-clamped); (9) **gas giants
  live** — gasFrag adds latitude-dependent zonal drift (bands shear against each other) + fbm
  storm shimmer; (10) **solar prominences** (pulsing additive limb arcs, faded past seg 2.4)
  and (11) Uranus' thin near-vertical ring; (12) Earth got a warm **sunset band along the
  terminator**. Fix along the way: 03 had no mulberry32 (belt placement) — helper copied from 23.
  Third wave ("Interstellar-Niveau" — calibrated honestly as the realtime approximation):
  (13) **gravitational lensing** at the black hole — a screen-space ShaderPass (rs²/r radial
  deflection toward the hole's projected position, capture zone → black) ramped in over the final
  approach; the accretion disc visibly folds over and under the horizon, the Gargantua signature.
  (14) **Rayleigh-flavoured Earth atmosphere** — blue day limb rolling into an orange scattering
  band at the terminator (thin! at width 0.16 it read as a fat orange stripe; 0.06 is right).
  (15) **Moon shadows on the gas giants** — up to 4 moon world-positions fed per-frame into
  gasFrag, analytic ray-past-sphere darkening; Galilean transits now cast moving shadows across
  Jupiter like the Juno shots. Tuning lessons: comet tail needed the same near-camera fade as the
  dust (a close tail reads as a chain of fat pearls) plus an orbit phase that keeps it out of the
  Earth station's opening shot; the asteroid belt needed coal-dark albedo (~0.05 real) and wider
  scatter — bright rocks lined up into a pearl band across every inner-planet backdrop because
  the camera always looks down the chain straight through the belt.
- 2026-07-03 — **bright archviz pass on `01-house-walkthrough`** (Nico: "hellere Designs, kommt
  professioneller"; 23-apex explicitly excluded — stays blocked on Higgsfield credits). The arc
  now STARTS as a bright clear afternoon (white sun, blue zenith, drifting fbm cumulus in the sky
  dome via new uCloud/uTime uniforms) and only rolls into golden hour past t≈0.4 — the old open
  sat deep in golden hour and read as a flat orange wash. Five day-stops instead of four (14:30 →
  21:00, hour axis + copy updated); brighter materials (plaster #eae3d6, concrete #dcd6ca, grass
  tinted #b3c489, brighter foliage, glass with stronger env reflection); environmentIntensity
  0.4→0.55; vignette softened (0.55→0.74 floor) — a heavy vignette reads moody, not professional.
  Night lantern payoff unchanged. Poster re-rendered on the daylight open.
  Max pass on top ("mach das zu einer 10/10"): full refurnish with RoundedBoxGeometry (hard box
  corners are the #1 toy-model tell) — sofa with reclined cushions + rug, dining chairs with
  backs, pendant cluster, kitchen island + counter, wall shelves with procedural books, framed
  art, layered bed with pillows/duvet/nightstands; slim steel head/sill profiles on the glazing;
  matte white fascia (a smooth one read as an LED strip — RoomEnvironment reflection);
  stepping-stone path + clipped hedges; a daylight interior fill light that hands over to the
  lamps at night; and 20k instanced wind-swayed grass blades (ShaderMaterial → manual
  instanceMatrix; unlit shader needs a uNight dimmer or the lawn glows after dark; blade height
  0.28 — 0.42 read as reeds, not lawn). Honest ceiling: low-poly trees + box architecture keep
  this stylized-real, not photoreal.
