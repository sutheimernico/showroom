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
| 02 | cyberpunk-alley | Cyberpunk alley | endless neon-rain flight · looping tiles + heavy post | dark neon | ☐ |
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
