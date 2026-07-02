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
| 08 | particle-morph | Particles | point cloud morphs shapes · attribute-lerp shader | dark neon | ☐ |
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
