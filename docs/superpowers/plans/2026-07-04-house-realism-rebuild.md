# 01-house-walkthrough Realism Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the 3D scene of `designs/01-house-walkthrough` from scratch for photographic realism — real lawn, real materials, real furniture, believable architecture — while keeping the existing concept (day→night arc scrubbed by scroll, cinematic camera ride, night "lantern" payoff) and the existing page chrome (copy, hour axis, loader, CSS).

**Architecture:** The page chrome (`<head>`, CSS, panels, hour axis) stays untouched; the entire `<script type="module">` block is rewritten. Realism comes from six levers applied together: (1) photographic camera language — eye-level path, 38° FOV, never clipping through the building; (2) AgX tone mapping + GTAO ambient occlusion + soft 4k shadows; (3) image-based lighting baked live from the sky dome via throttled PMREM so GI follows the time of day; (4) a layered lawn (anti-tiling ground shader + ~45k wind-swayed instanced blade clumps); (5) architecture with wall thickness, recessed glazing, plinth, and physically-based glass; (6) CC0 photoscanned furniture (Poly Haven GLTF) replacing all procedural boxes indoors.

**Tech Stack:** Three.js r185 (WebGLRenderer, MeshPhysicalMaterial, GTAOPass, PMREMGenerator), GSAP ScrollTrigger + Lenis (unchanged), Poly Haven CC0 assets, existing Playwright shot/poster harness for verification.

**Verification model:** This repo has no unit-test framework; the build loop's test harness is `tools/shot.sh` (screenshots at scroll positions + console-error check + SwiftShader-lower-bound FPS). Every task ends with a shot run and a concrete visual checklist instead of a unit test. Screenshots MUST be viewed (Read tool), not just generated.

**Server note:** Port 8080 is occupied by Airflow on this machine. Serve with
`python3 -m http.server 8123 --directory /path/to/showroom`
and use `http://localhost:8123/designs/01-house-walkthrough/` everywhere below.

---

## File Structure

- Modify: `designs/01-house-walkthrough/index.html` — only the `<script type="module">` block (lines ~172–757) is replaced; head/CSS/markup stay. Single-file design is the repo convention (every design is one self-contained `index.html`).
- Create: `designs/01-house-walkthrough/textures/leafy_grass_{diff,nor_gl,rough}_1k.jpg` — lawn ground PBR set.
- Create: `designs/01-house-walkthrough/textures/patterned_concrete_pavers_03_{diff,nor_gl,rough}_1k.jpg` — terrace PBR set.
- Create: `designs/01-house-walkthrough/models/<slug>/…` for `sofa_03`, `ArmChair_01`, `coffee_table_round_01`, `dining_table`, `dining_chair_02`, `anthurium_botany_01` (GLTF 1k + bin + textures each).
- Modify: `designs/01-house-walkthrough/textures/SOURCES.md`, `designs/01-house-walkthrough/models/SOURCES.md` — provenance rows for the new assets.
- Modify: `PLAN.md` — outcome log entry (repo convention, see the dated entries around line 90).
- Keep: existing textures (`painted_plaster_wall`, `concrete_floor_02`, `wood_floor_deck` stay in use; `aerial_grass_rock` becomes unused but stays on disk — removal is a separate decision for the user).
- NOT modified: `shared/lib.js` (renderer defaults are overridden per-design after `makeRenderer()`).

## Design decisions locked by this plan

| Problem in current build | Decision |
|---|---|
| Lawn = saturated green + baked hard stripes + noise blades | Layered lawn: `leafy_grass` PBR ground with anti-tiling macro blend + soft shading stripes, plus ~45k instanced blade-cluster cards (canvas-drawn alpha texture) with vertex wind |
| Terrace/interior floors read as mud | Terrace: `patterned_concrete_pavers_03`. Interior: keep `wood_floor_deck` but 3× finer repeat + brighter base + GTAO grounding |
| Box-model architecture | Wall thickness 0.28 m, glazing recessed into reveals, visible plinth, roof slab with fascia + lighter soffit, parapet lip — no glowing edges (matte, `envMapIntensity 0.1`) |
| Ghost-plane glass | `MeshPhysicalMaterial` with `transmission` on hardware GPUs; automatic cheap fallback (transparent standard material) on software rasterizers |
| Toy furniture | Poly Haven photoscanned GLTFs (sofa, armchair, coffee table, dining set, plant); procedural pieces only where nothing fits (bed upstairs, pendant shades) |
| Drone-height 58° FOV camera that clips through the slab | Eye-level (1.5–3 m) path, FOV 38, all keyframes outside the building envelope |
| Flat lighting / salmon night walls | AgX tone mapping, PMREM env baked live from the sky dome (GI follows time of day), warm-tint removed from wall albedo, night practicals: pendants, eave spots washing the facade, pool light |
| Old crutches no longer needed | Dust motes, `RoomEnvironment`, emissive-wall "lantern fake" are dropped — the lantern payoff now comes from real practicals + bloom |

## Scene coordinate contract (used by every task)

House center at origin. South = +z (glass facade + terrace), west = −x (sun sets in the west, i.e. sun travels toward −x). Ground floor slab top at y=0. Lawn plane at y=−0.12. All units meters.

---

### Task 0: Branch + baseline capture

**Files:** none modified.

- [ ] **Step 0.1: Create the working branch** (repo is on `autopilot/work`, clean tree)

```bash
cd /path/to/showroom
git checkout -b feat/01-house-realism
```

- [ ] **Step 0.2: Ensure the server runs on :8123**

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8123/ \
  || (nohup python3 -m http.server 8123 --directory /path/to/showroom > /tmp/showroom-serve.log 2>&1 &)
```
Expected: `200` (immediately or after starting).

- [ ] **Step 0.3: Capture the FPS baseline of the OLD scene** (SwiftShader lower bound, for regression comparison in Task 9)

```bash
SHOT_POS="0,0.5,1" bash tools/shot.sh http://localhost:8123/designs/01-house-walkthrough/ house-baseline 1600 900
```
Expected: `OK — no console errors`, an `fps` line (record `avgFps`/`lowFps` numbers in the task notes), shots in `tools/shots/house-baseline/`.

---

### Task 1: Download CC0 assets (textures + furniture models)

**Files:**
- Create: `designs/01-house-walkthrough/textures/{leafy_grass,patterned_concrete_pavers_03}_{diff,nor_gl,rough}_1k.jpg`
- Create: `designs/01-house-walkthrough/models/{sofa_03,ArmChair_01,coffee_table_round_01,dining_table,dining_chair_02,anthurium_botany_01}/…`
- Modify: both `SOURCES.md` files

- [ ] **Step 1.1: Download the two texture sets** (Poly Haven URL pattern, same as existing sets)

```bash
cd /path/to/showroom/designs/01-house-walkthrough/textures
for name in leafy_grass patterned_concrete_pavers_03; do
  for map in diff nor_gl rough; do
    curl -sfLO "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/${name}/${name}_${map}_1k.jpg" \
      && echo "OK ${name}_${map}" || echo "FAIL ${name}_${map}"
  done
done
```
Expected: 6 × `OK …`. If any `FAIL`: query `https://api.polyhaven.com/files/<name>` and use the exact URL from `.textures` there (map key naming can differ per asset, e.g. `nor_gl` vs `nor_dx`).

- [ ] **Step 1.2: Download the six furniture/plant models via the Poly Haven files API** (the API lists exact URLs for the `.gltf`, `.bin`, and every texture — no guessed paths)

```bash
cd /path/to/showroom/designs/01-house-walkthrough/models
for slug in sofa_03 ArmChair_01 coffee_table_round_01 dining_table dining_chair_02 anthurium_botany_01; do
  python3 - "$slug" <<'EOF'
import json, sys, urllib.request, pathlib
slug = sys.argv[1]
d = json.load(urllib.request.urlopen(f"https://api.polyhaven.com/files/{slug}"))
g = d["gltf"]["1k"]["gltf"]
files = {f"{slug}.gltf": g["url"], **{k: v["url"] for k, v in g.get("include", {}).items()}}
for rel, url in files.items():
    out = pathlib.Path(slug) / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, out)
    print("OK", out)
EOF
done
```
Expected: `OK <slug>/…` lines for every file; each model folder contains a `.gltf`, a `.bin`, and `textures/*.jpg`. Spot-check: `ls sofa_03/`.

- [ ] **Step 1.3: Record provenance** — append to `textures/SOURCES.md` table:

```markdown
| `leafy_grass` | Lawn ground | `leafy_grass_{diff,nor_gl,rough}_1k.jpg` | 1024×1024 |
| `patterned_concrete_pavers_03` | Terrace pavers | `patterned_concrete_pavers_03_{diff,nor_gl,rough}_1k.jpg` | 1024×1024 |
```

and to `models/SOURCES.md`:

```markdown
- `sofa_03/`, `ArmChair_01/`, `coffee_table_round_01/`, `dining_table/`, `dining_chair_02/`,
  `anthurium_botany_01/` — Poly Haven photoscans/models (polyhaven.com/a/<slug>), CC0. gltf 1k versions,
  downloaded via the files API (api.polyhaven.com/files/<slug>).
```

- [ ] **Step 1.4: Commit**

```bash
cd /path/to/showroom
git add designs/01-house-walkthrough/textures designs/01-house-walkthrough/models
git commit -m "feat(01-house): add CC0 lawn/paver textures and furniture models (Poly Haven)"
```

---

### Task 2: Scene scaffold — renderer, sky, live-baked environment, day stops, camera rig

Replace the entire `<script type="module">` block of `designs/01-house-walkthrough/index.html` with the scaffold below. It renders a complete (still furniture-less) world: sky with clouds/stars, lawn-green ground placeholder, sun + hemisphere lights, PMREM environment baked from the sky, scroll-driven camera on the new eye-level path, bloom + grade post chain. Later tasks fill the clearly marked `SECTION` anchors.

**Files:**
- Modify: `designs/01-house-walkthrough/index.html` (script block only)

- [ ] **Step 2.1: Replace the script block** with exactly this content:

```html
<script type="module">
import { THREE, gsap, ScrollTrigger, makeRenderer, makeComposer, attachLifecycle, smoothScroll, loop, onResize, loaderOverlay, reducedMotion, mapClamp } from '../../shared/lib.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';

const loader = loaderOverlay();

// ---------------------------------------------------------------- renderer / scene
const renderer = makeRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// AgX instead of lib.js' ACES default: film-like highlight rolloff and it tames
// saturated greens/oranges — the old lawn read radioactive under ACES.
renderer.toneMapping = THREE.AgXToneMapping;

// software rasterizer (headless shot harness) → cheaper code paths, same look philosophy
const _glinfo = (() => {
  const gl = renderer.getContext();
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  return String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
})();
const SOFT_GPU = /swiftshader|llvmpipe|software/i.test(_glinfo);

const scene = new THREE.Scene();
scene.background = null;
scene.fog = new THREE.FogExp2('#cfe0ee', 0.0016);

// 38° ≈ a 50mm lens — the old 58° wide angle distorted the house into a miniature
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 260);

const root = new THREE.Group();
scene.add(root);

// ---------------------------------------------------------------- asset loading
const maxAniso = renderer.capabilities.getMaxAnisotropy();
const manager = new THREE.LoadingManager();
const texLoader = new THREE.TextureLoader(manager);
const gltfLoader = new GLTFLoader(manager);

function pbr(name, rx, ry = rx) {
  const tex = (suffix, srgb) => {
    const t = texLoader.load(`./textures/${name}_${suffix}_1k.jpg`);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.anisotropy = maxAniso;
    return t;
  };
  return { map: tex('diff', true), normalMap: tex('nor_gl', false), roughnessMap: tex('rough', false) };
}

// Poly Haven GLTFs are real-scale, y-up, origin at floor level.
function loadModel(path, { scale = 1, x = 0, y = 0, z = 0, ry = 0 } = {}) {
  return new Promise((resolve) => {
    gltfLoader.load(path, (g) => {
      const obj = g.scene;
      obj.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true; o.receiveShadow = true;
          if (o.material && o.material.transparent) {     // leaf/foliage cards → cutout
            o.material.alphaTest = 0.5; o.material.transparent = false;
            o.material.side = THREE.DoubleSide; o.material.depthWrite = true;
          }
        }
      });
      obj.scale.setScalar(scale); obj.position.set(x, y, z); obj.rotation.y = ry;
      root.add(obj); resolve(obj);
    }, undefined, () => resolve(null));
  });
}

// deterministic PRNG — Math.random() would reshuffle the lawn/books every reload
const prng = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---------------------------------------------------------------- sky dome (visual + light source)
const skyUniforms = {
  uHorizon: { value: new THREE.Color('#dbe9f4') },
  uZenith:  { value: new THREE.Color('#4a7fd4') },
  uSunCol:  { value: new THREE.Color('#fff6e6') },
  uSunDir:  { value: new THREE.Vector3(-1, 0.5, 0.6).normalize() },
  uStars:   { value: 0 },
  uCloud:   { value: 1 },
  uTime:    { value: 0 },
};
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyUniforms,
  vertexShader: `
    varying vec3 vDir;
    void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform vec3 uHorizon, uZenith, uSunCol, uSunDir;
    uniform float uStars, uCloud, uTime;
    varying vec3 vDir;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
    float fbm2(vec2 p){ float v=0.0, a=0.5; for(int k=0;k<5;k++){ v+=a*noise2(p); p*=2.03; a*=0.5; } return v; }
    void main(){
      vec3 dir = normalize(vDir);
      float h = clamp(dir.y, 0.0, 1.0);
      vec3 col = mix(uHorizon, uZenith, pow(h, 0.42));
      float sd = max(dot(dir, normalize(uSunDir)), 0.0);
      col += uSunCol * (pow(sd, 8.0) * 0.35 + pow(sd, 350.0) * 3.0);   // haze + tight disc
      col += uHorizon * exp(-dir.y * dir.y * 60.0) * 0.12;             // horizon sliver
      if (uCloud > 0.001 && dir.y > 0.015) {
        vec2 cuv = dir.xz / (dir.y + 0.16) * 1.2;
        float base = fbm2(cuv * 0.6 + vec2(uTime * 0.004, 0.0));
        float cl = smoothstep(0.52, 0.78, base);
        float horFade = smoothstep(0.015, 0.2, dir.y);
        // lit and shadowed side of the cumulus — flat white blobs read painted
        vec3 lit = mix(uHorizon, vec3(1.04, 1.02, 0.99), 0.8) * (0.85 + 0.5 * pow(sd, 2.0));
        vec3 shade = mix(uZenith, uHorizon, 0.5) * 0.9;
        float inner = smoothstep(0.6, 0.95, base);
        col = mix(col, mix(lit, shade, inner * 0.55), cl * horFade * uCloud * 0.9);
      }
      if (uStars > 0.001) {
        vec2 uv = dir.xz / max(dir.y, 0.10);
        vec2 g = uv * 90.0;
        vec2 id = floor(g);
        vec2 f = fract(g) - 0.5 - (vec2(hash(id + 3.1), hash(id + 6.7)) - 0.5) * 0.7;
        float s = step(0.986, hash(id)) * smoothstep(0.05, 0.0, length(f)) * (0.4 + 0.6 * hash(id + 9.2));
        col += vec3(s) * uStars * smoothstep(0.06, 0.4, dir.y);
      }
      gl_FragColor = vec4(col, 1.0);
    }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(220, 48, 28), skyMat);
sky.renderOrder = -1;
scene.add(sky);

// live IBL: a second dome sharing skyMat lives in its own scene; PMREM-bake it
// (throttled) so ambient light/reflections track the exact sky of the moment —
// blue-ish GI at noon, amber at golden hour, near-black at night.
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 24, 16), skyMat));
let envRT = null, lastEnvT = -9;
const ENV_STEP = SOFT_GPU ? 0.10 : 0.03;
function bakeEnv(t) {
  if (envRT && Math.abs(t - lastEnvT) < ENV_STEP) return;
  lastEnvT = t;
  const old = envRT;
  envRT = pmrem.fromScene(envScene, 0.05);
  scene.environment = envRT.texture;
  if (old) old.dispose();
}

// ---------------------------------------------------------------- lights
const sun = new THREE.DirectionalLight('#fff6e6', 4.2);
sun.castShadow = true;
sun.shadow.mapSize.set(SOFT_GPU ? 1024 : 4096, SOFT_GPU ? 1024 : 4096);
sun.shadow.camera.near = 1; sun.shadow.camera.far = 80;
sun.shadow.camera.left = -17; sun.shadow.camera.right = 17;
sun.shadow.camera.top = 17; sun.shadow.camera.bottom = -17;
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.02;
sun.shadow.radius = 4;
scene.add(sun, sun.target);
sun.target.position.set(0, 1, 0);

const hemi = new THREE.HemisphereLight('#bcd4ea', '#4a4436', 0.55);
scene.add(hemi);

// SECTION: practicals — night light fixtures land here in Task 7
const practicals = { pendants: [], fills: [], eaves: [], pool: null, dayFill: null };

// ---------------------------------------------------------------- day → night keyframes
// hor/zen: sky gradient. sunPos: west-travelling arc (west = -x). pt: practicals 0→1.
// envI: PMREM environment intensity. expo: AgX exposure trim.
const stops = [
  { at: 0.00, hor: '#dbe9f4', zen: '#4a7fd4', sun: '#fff6e6', sunI: 4.2, hemiI: 0.55, envI: 0.85, pt: 0.00, fog: 0.0016, expo: 1.15, stars: 0.0,  cloud: 1.0,  sunPos: [-14, 18, 10] },
  { at: 0.35, hor: '#eed9ac', zen: '#3f6fbe', sun: '#ffe7bd', sunI: 3.4, hemiI: 0.45, envI: 0.75, pt: 0.00, fog: 0.0030, expo: 1.08, stars: 0.0,  cloud: 0.8,  sunPos: [-20, 10, 9] },
  { at: 0.60, hor: '#ff9e58', zen: '#2e3560', sun: '#ffb066', sunI: 2.4, hemiI: 0.32, envI: 0.60, pt: 0.12, fog: 0.0060, expo: 1.00, stars: 0.0,  cloud: 0.45, sunPos: [-24, 4, 2] },
  { at: 0.80, hor: '#8e5f7a', zen: '#141a33', sun: '#7f8ec2', sunI: 0.6, hemiI: 0.22, envI: 0.38, pt: 0.60, fog: 0.0090, expo: 0.95, stars: 0.45, cloud: 0.2,  sunPos: [-16, 1.2, -8] },
  { at: 1.00, hor: '#0f1830', zen: '#04060d', sun: '#3c4c8a', sunI: 0.1, hemiI: 0.15, envI: 0.24, pt: 1.00, fog: 0.0120, expo: 1.00, stars: 1.0,  cloud: 0.08, sunPos: [-8, -2, -12] },
];
const _cA = new THREE.Color(), _cB = new THREE.Color();
const lerp = (a, b, t) => a + (b - a) * t;
const lerpCol = (target, a, b, k) => { _cA.set(a); _cB.set(b); target.copy(_cA).lerp(_cB, k); };
let dayState = { pt: 0 };
function applyDay(t) {
  let i = 0; while (i < stops.length - 2 && t > stops[i + 1].at) i++;
  const a = stops[i], b = stops[i + 1];
  const k = mapClamp(t, a.at, b.at, 0, 1);
  lerpCol(skyUniforms.uHorizon.value, a.hor, b.hor, k);
  scene.fog.color.copy(skyUniforms.uHorizon.value);
  lerpCol(skyUniforms.uZenith.value, a.zen, b.zen, k);
  lerpCol(sun.color, a.sun, b.sun, k);
  skyUniforms.uSunCol.value.copy(sun.color);
  skyUniforms.uStars.value = lerp(a.stars, b.stars, k);
  skyUniforms.uCloud.value = lerp(a.cloud, b.cloud, k);
  scene.fog.density = lerp(a.fog, b.fog, k);
  sun.intensity = lerp(a.sunI, b.sunI, k);
  sun.position.set(lerp(a.sunPos[0], b.sunPos[0], k), lerp(a.sunPos[1], b.sunPos[1], k), lerp(a.sunPos[2], b.sunPos[2], k));
  skyUniforms.uSunDir.value.copy(sun.position).normalize();
  hemi.intensity = lerp(a.hemiI, b.hemiI, k);
  hemi.color.copy(skyUniforms.uZenith.value).lerp(skyUniforms.uHorizon.value, 0.5);
  scene.environmentIntensity = lerp(a.envI, b.envI, k);
  renderer.toneMappingExposure = lerp(a.expo, b.expo, k);
  const pt = lerp(a.pt, b.pt, k);
  dayState.pt = pt;
  // SECTION: applyDay-practicals — intensities wired in Task 7
  bloom.strength = 0.12 + pt * 0.5;
}

// ---------------------------------------------------------------- world
// SECTION: ground — placeholder plane; Task 3 replaces with the layered lawn
const groundPlaceholder = new THREE.Mesh(
  new THREE.CircleGeometry(60, 48).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: '#5b7a45', roughness: 1 })
);
groundPlaceholder.position.y = -0.12;
groundPlaceholder.receiveShadow = true;
root.add(groundPlaceholder);

// SECTION: house — Task 4 (shell/terrace/pool) and Task 5 (glazing)
// SECTION: interior — Task 6 (furniture GLTFs + fittings)
// SECTION: garden — Task 6 (trees, hedges, path)

// ---------------------------------------------------------------- camera rig
// Eye-level path, always outside the building envelope. South (+z) is the glass side.
const eye = new THREE.CatmullRomCurve3([
  new THREE.Vector3( 17, 1.9, 15),   // t 0.00 SE hero, sunny afternoon
  new THREE.Vector3(  8, 1.7, 17),   //   dolly west along the south facade
  new THREE.Vector3(  2.5, 1.6, 12), //   approach the terrace
  new THREE.Vector3( -2, 1.5, 9.5),  //   pool close-up, golden hour begins
  new THREE.Vector3(-10, 2.2, 12),   //   SW corner arc
  new THREE.Vector3(-14, 2.6, 4),    //   west elevation, sun backlights the house
  new THREE.Vector3( -4, 2.4, 16),   //   swing back to frontal south, dusk
  new THREE.Vector3( 13, 3.0, 19),   // t 1.00 wide night hero
]);
const aim = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 1.8, 0), new THREE.Vector3(-1, 1.7, 1), new THREE.Vector3(-2, 1.5, 2),
  new THREE.Vector3(0, 1.2, 5),                                  // down at the pool
  new THREE.Vector3(-1, 2.0, 0), new THREE.Vector3(-1, 3.2, -1), // up at the upper volume
  new THREE.Vector3(0, 1.9, 0), new THREE.Vector3(0, 2.2, 0),
]);

// ---------------------------------------------------------------- post
const composer = makeComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
// SECTION: gtao — Task 8 inserts GTAOPass here (hardware GPUs only)
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.12, 0.6, 0.85);
composer.addPass(bloom);
const VignetteGrain = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 1.0 }, uGrain: { value: 0.045 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime, uVig, uGrain; varying vec2 vUv;
    float rand(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(luma), col, 1.06);            // AgX desaturates — give a little back
      col = (col - 0.5) * 1.03 + 0.5;
      vec2 d = vUv - 0.5;
      float vig = smoothstep(0.95, 0.3, dot(d, d) * uVig * 2.0);
      col *= mix(0.8, 1.0, vig);
      col += (rand(vUv + uTime) - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }`,
};
const vig = new ShaderPass(VignetteGrain);
composer.addPass(vig);

// ---------------------------------------------------------------- scroll wiring (unchanged concept)
smoothScroll({ lerp: 0.08 });
const state = { t: 0 };
const marker = document.querySelector('.hours .marker');
const nowLabel = document.querySelector('.hours .now');
const fmtHour = (t) => { const m = Math.round(lerp(14 * 60 + 30, 21 * 60, t)); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
ScrollTrigger.create({
  trigger: '.scroll', start: 'top top', end: 'bottom bottom', scrub: 1,
  onUpdate: (self) => {
    state.t = self.progress;
    if (marker) marker.style.top = `${self.progress * 100}%`;
    if (nowLabel) { nowLabel.style.top = `${self.progress * 100}%`; nowLabel.textContent = fmtHour(self.progress); }
  },
});
if (!reducedMotion) {
  gsap.utils.toArray('.panel .inner').forEach((el) => {
    gsap.from(el, { opacity: 0, y: 42, duration: 1, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'top 45%', scrub: true } });
  });
}

// ---------------------------------------------------------------- resize + render loop
function resize(w, h) {
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h); composer.setSize(w, h);
  bloom.setSize(w, h);
}
onResize(resize);
attachLifecycle(renderer, scene, composer);

const _p = new THREE.Vector3(), _a = new THREE.Vector3();
applyDay(0);
bakeEnv(0);
eye.getPointAt(0, camera.position);
aim.getPointAt(0, _a); camera.lookAt(_a);

// SECTION: loop-uniforms — per-frame uniform updates (grass wind lands here in Task 3)
loop((elapsed, dt) => {
  const t = state.t;
  eye.getPointAt(t, _p);
  camera.position.lerp(_p, 1 - Math.exp(-7.7 * dt));   // frame-rate-independent settle
  aim.getPointAt(t, _a);
  camera.lookAt(_a);
  applyDay(t);
  bakeEnv(t);
  sky.position.copy(camera.position);
  vig.uniforms.uTime.value = elapsed;
  skyUniforms.uTime.value = elapsed;
  composer.render();
});

manager.onProgress = (_url, n, total) => loader.set(total ? n / total : 1);
manager.onLoad = () => { loader.set(1); setTimeout(() => loader.done(), 350); };
manager.onError = () => { loader.set(1); setTimeout(() => loader.done(), 350); };
</script>
```

- [ ] **Step 2.2: Verify the scaffold renders**

```bash
SHOT_POS="0,0.5,1" bash tools/shot.sh http://localhost:8123/designs/01-house-walkthrough/ house-t2 1600 900
```
Expected: `OK — no console errors`. View all three shots (Read tool). Checklist:
- t=0: blue sky with cumulus, green ground disc, horizon haze — NO black frame, NO missing-uniform artifacts.
- t=0.5: amber/orange sky, sun low in the west (left side when looking north).
- t=1: near-black sky with stars, ground barely visible.
- Camera height looks human (horizon around mid-frame), not drone-like.

- [ ] **Step 2.3: Commit**

```bash
git add designs/01-house-walkthrough/index.html
git commit -m "feat(01-house): rebuild scene scaffold — AgX, eye-level rig, live sky-baked IBL"
```

---

### Task 3: Layered lawn — anti-tiling ground + 45k instanced blade clumps

**Files:**
- Modify: `designs/01-house-walkthrough/index.html` — replace `SECTION: ground`, add wind update at `SECTION: loop-uniforms`

- [ ] **Step 3.1: Replace the `SECTION: ground` block** (delete `groundPlaceholder` and its `root.add`) with:

```js
// SECTION: ground — layered lawn.
// Layer 1: leafy_grass PBR ground. onBeforeCompile injects (a) a macro re-sample of the
// same map at 1/9 scale to kill visible tiling, (b) soft sine mowing bands (shading-only,
// never baked hard rects), (c) a worn dirt blend hugging the house plinth.
const groundMat = new THREE.MeshStandardMaterial({ ...pbr('leafy_grass', 26), roughness: 1, metalness: 0 });
groundMat.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWpos;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWpos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWpos;')
    .replace('#include <map_fragment>', `#include <map_fragment>
      vec3 macro = texture2D(map, vMapUv * 0.11).rgb;
      diffuseColor.rgb *= mix(vec3(1.0), macro * 1.8, 0.42);
      float stripe = smoothstep(-0.9, 0.9, sin(vWpos.x * 0.7854));
      diffuseColor.rgb *= 0.96 + stripe * 0.08;
      float distEdge = max(abs(vWpos.x), abs(vWpos.z) - 1.0);
      float wear = smoothstep(10.5, 8.0, distEdge);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.85, 0.78, 0.62), wear * 0.22);
    `);
};
const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48).rotateX(-Math.PI / 2), groundMat);
ground.position.y = -0.12;
ground.receiveShadow = true;
root.add(ground);

// Layer 2: instanced blade clumps. A canvas-drawn cluster texture (≈10 curved blades,
// dark base → light tip, alpha cutout) on two crossed quads per clump. Standard material
// keeps them lit/shadowed by the real sun; onBeforeCompile adds tip-weighted wind sway.
function makeBladeTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const rnd = prng(4242);
  g.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 11; i++) {
    const bx = 24 + rnd() * 208;
    const lean = (rnd() - 0.5) * 90;
    const h = 150 + rnd() * 100;
    const w = 7 + rnd() * 8;
    const grad = g.createLinearGradient(0, 256, 0, 256 - h);
    grad.addColorStop(0, `rgb(${38 + rnd() * 14}, ${66 + rnd() * 16}, ${26 + rnd() * 8})`);
    grad.addColorStop(1, `rgb(${96 + rnd() * 30}, ${140 + rnd() * 26}, ${58 + rnd() * 16})`);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(bx - w / 2, 256);
    g.quadraticCurveTo(bx - w / 4 + lean * 0.4, 256 - h * 0.6, bx + lean, 256 - h);
    g.quadraticCurveTo(bx + w / 4 + lean * 0.4, 256 - h * 0.6, bx + w / 2, 256);
    g.closePath(); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  return t;
}
const grassWind = { value: 0 };
(function buildLawn() {
  const rnd = prng(1234);
  const COUNT = SOFT_GPU ? 7000 : 45000;
  const quad = new THREE.PlaneGeometry(0.34, 0.30, 1, 2); quad.translate(0, 0.15, 0);
  const quad2 = quad.clone().rotateY(Math.PI / 2);
  const geo = mergeGeometries([quad, quad2]);
  const mat = new THREE.MeshStandardMaterial({
    map: makeBladeTexture(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.95, metalness: 0,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = grassWind.uniform = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float tip = clamp(position.y / 0.30, 0.0, 1.0);
        float phase = instanceMatrix[3][0] * 0.9 + instanceMatrix[3][2] * 1.3;
        float sway = sin(uTime * 1.7 + phase) * 0.05 * tip * tip;
        transformed.x += sway; transformed.z += sway * 0.55;
      `);
  };
  const inst = new THREE.InstancedMesh(geo, mat, COUNT);
  inst.receiveShadow = true;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const col = new THREE.Color();
  let placed = 0;
  while (placed < COUNT) {
    const r = Math.sqrt(rnd()) * 34;                       // uniform-by-area disc
    const ang = rnd() * 6.2832;
    const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
    if (x > -8.6 && x < 8.6 && z > -6.4 && z < 8.6) continue;   // house+terrace footprint
    p.set(x, -0.12, z);
    e.set(0, rnd() * 6.2832, (rnd() - 0.5) * 0.15); q.setFromEuler(e);
    const sc = 0.7 + rnd() * 0.6; s.set(sc, sc * (0.8 + rnd() * 0.5), sc);
    m.compose(p, q, s);
    inst.setMatrixAt(placed, m);
    col.setHSL(0.26 + rnd() * 0.03, 0.42 + rnd() * 0.15, 0.30 + rnd() * 0.12);
    inst.setColorAt(placed, col);
    placed++;
  }
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  scene.add(inst);
})();
```

- [ ] **Step 3.2: Drive the wind** — inside the `loop()` callback at `SECTION: loop-uniforms`, add:

```js
  if (grassWind.uniform) grassWind.uniform.value = reducedMotion ? 0 : elapsed;
```

- [ ] **Step 3.3: Verify**

```bash
SHOT_POS="0,0.5,1" bash tools/shot.sh http://localhost:8123/designs/01-house-walkthrough/ house-t3 1600 900
```
Expected: no console errors. View shots. Checklist:
- Lawn reads as a real kept lawn: natural desaturated green (AgX), no visible texture tiling at distance, soft wide mowing bands (subtle!), blade clumps visible near the camera with color variation.
- No blades poking through where the house footprint is.
- t=1: lawn goes properly dark (real lighting — no self-glow).
- If the lawn is too yellow/too dark: adjust `groundMat` color multiplier or the HSL ranges — judge from the screenshot, not the code.

- [ ] **Step 3.4: Commit**

```bash
git add designs/01-house-walkthrough/index.html
git commit -m "feat(01-house): layered lawn — anti-tiling ground shader + instanced blade clumps"
```

---

### Task 4: House shell, terrace, pool — architecture with real wall depth

**Files:**
- Modify: `designs/01-house-walkthrough/index.html` — fill `SECTION: house`

- [ ] **Step 4.1: Add materials + build helpers and the shell** at `SECTION: house`:

```js
// SECTION: house
const M = {
  plaster: new THREE.MeshStandardMaterial({ ...pbr('painted_plaster_wall', 3, 1.4), color: '#e6e1d6', roughness: 1 }),
  concrete: new THREE.MeshStandardMaterial({ ...pbr('concrete_floor_02', 3), color: '#c9c4ba', roughness: 1 }),
  pavers: new THREE.MeshStandardMaterial({ ...pbr('patterned_concrete_pavers_03', 5, 2.2), color: '#d8d4cc', roughness: 1 }),
  woodFloor: new THREE.MeshStandardMaterial({ ...pbr('wood_floor_deck', 9, 6), color: '#e8ddca', roughness: 0.85 }),
  fascia: new THREE.MeshStandardMaterial({ color: '#3f3b35', roughness: 0.85, metalness: 0, envMapIntensity: 0.1 }),
  soffit: new THREE.MeshStandardMaterial({ color: '#ece7db', roughness: 0.95, envMapIntensity: 0.15 }),
  steel: new THREE.MeshStandardMaterial({ color: '#26241f', roughness: 0.45, metalness: 0.85 }),
  innerWall: new THREE.MeshStandardMaterial({ color: '#efeae0', roughness: 0.97 }),
  darkStone: new THREE.MeshStandardMaterial({ color: '#2b2e30', roughness: 0.4, metalness: 0.05 }),
};
function box(w, h, d, mat, x, y, z, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = cast; m.receiveShadow = receive;
  root.add(m);
  return m;
}

(function buildShell() {
  const T = 0.28;                                  // wall thickness — the anti-cardboard number
  // plinth + floor slabs: house sits ON something, not in the grass
  box(13.2, 0.35, 9.2, M.concrete, 0, -0.35, 0);                       // plinth, proud of the lawn
  box(12.4, 0.12, 8.4, M.woodFloor, 0, -0.02, 0, { cast: false });     // GF interior floor
  // north wall (solid) + west wall (solid, clerestory slot)
  box(12.8, 3.2, T, M.plaster, 0, 0, -4 - T / 2);
  box(T, 2.3, 8, M.plaster, -6.2 - T / 2, 0, 0);
  box(T, 0.55, 8, M.plaster, -6.2 - T / 2, 2.65, 0);
  // east wall: solid with a big recessed opening (reveal depth = T)
  box(T, 3.2, 2.6, M.plaster, 6.2 + T / 2, 0, -2.7);
  box(T, 3.2, 1.6, M.plaster, 6.2 + T / 2, 0, 3.2);
  box(T, 0.5, 8, M.plaster, 6.2 + T / 2, 2.7, 0);                      // header band
  // south facade: slim structural piers between full-height glass bays
  for (const px of [-6.2, -2.1, 2.1, 6.2]) box(0.24, 3.2, 0.24, M.steel, px, 0, 4 + 0.12);
  // interior core wall (kitchen back) + stair spine
  box(4.6, 3.2, 0.18, M.innerWall, -3.4, 0, -1.6);
  // upper volume over the west half, slightly cantilevered west
  box(7.4, 0.3, 8.4, M.concrete, -2.8, 3.2, 0);                        // first-floor slab edge visible
  box(7.4, 2.7, T, M.plaster, -2.8, 3.5, -4 - T / 2);
  box(7.4, 2.7, T, M.plaster, -2.8, 3.5, 2.2);                          // upper south wall w/ ribbon window cut:
  box(T, 2.7, 6.2 + T, M.plaster, -6.5 - T / 2, 3.5, -0.9 + T / 2);
  box(T, 2.7, 6.2 + T, M.plaster, 0.9 + T / 2, 3.5, -0.9 + T / 2);
  // ribbon window: punch = header + sill bands on the upper south wall
  // (wall above was placed at z=2.2 — replace that single solid with 3 bands)
  // roof slab + dark fascia + light soffit under the overhang
  box(9.2, 0.3, 10.2, M.concrete, -2.8, 6.2, -0.3);
  box(9.3, 0.18, 10.3, M.fascia, -2.8, 6.5, -0.3, { cast: false });
  box(9.0, 0.03, 10.0, M.soffit, -2.8, 6.17, -0.3, { cast: false });
  // GF roof over the east (single-storey) part: overhang south for the terrace
  box(7.2, 0.28, 10.6, M.concrete, 3.4, 3.2, 0.4);
  box(7.3, 0.16, 10.7, M.fascia, 3.4, 3.46, 0.4, { cast: false });
  box(7.0, 0.03, 10.4, M.soffit, 3.4, 3.17, 0.4, { cast: false });
})();

(function buildTerrace() {
  // paver terrace platform, 2 steps down to the lawn, pool with dark liner + coping
  box(13.2, 0.15, 5.6, M.pavers, 0.6, -0.15, 6.6, { cast: false });
  box(13.2, 0.12, 0.5, M.pavers, 0.6, -0.27, 9.55, { cast: false });   // step 1
  box(13.2, 0.12, 0.5, M.pavers, 0.6, -0.39, 10.05, { cast: false });  // step 2
  // pool: coping ring + dark basin + water plane (material refined in Task 5)
  box(4.6, 0.1, 2.9, M.concrete, 3.6, -0.05, 6.9, { cast: false });    // coping
  box(4.2, 0.05, 2.5, M.darkStone, 3.6, -0.1, 6.9, { cast: false });   // basin hint
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 2.5).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#0e3440', roughness: 0.05, metalness: 0.1, envMapIntensity: 1.4 })
  );
  water.position.set(3.6, 0.02, 6.9);
  root.add(water);
  // stepping pavers from terrace into the lawn
  for (let i = 0; i < 5; i++) box(0.9, 0.05, 0.6, M.pavers, -3.4 - i * 0.15, -0.10, 9.8 + i * 0.95, { cast: false });
})();
```

Note on the "ribbon window cut" comment: implement the upper south wall as **three** boxes instead of one — sill `box(7.4, 0.7, T, M.plaster, -2.8, 3.5, 2.2)`, header `box(7.4, 0.6, T, M.plaster, -2.8, 5.6, 2.2)`, and two end piers `box(0.5, 1.4, T, M.plaster, -6.0, 4.2, 2.2)` / `box(0.5, 1.4, T, M.plaster, 0.4, 4.2, 2.2)` — the glass for the gap comes in Task 5. Delete the single full-height upper-south-wall box when doing this.

- [ ] **Step 4.2: Verify**

```bash
SHOT_POS="0,0.35,0.75" bash tools/shot.sh http://localhost:8123/designs/01-house-walkthrough/ house-t4 1600 900
```
Expected: no console errors. Checklist (view shots):
- The house reads as a building: visible plinth under the walls, walls with thickness at the east opening, roof slab with dark edge + light soffit shadow line, upper volume offset with visible slab edge.
- Terrace is light pavers (NOT mud), pool coping reads as stone, steps down to lawn visible.
- Nothing floats; grass meets the plinth, not the wall.
- Composition from t=0: house fills ~half the frame width, terrace in foreground right.

- [ ] **Step 4.3: Commit**

```bash
git add designs/01-house-walkthrough/index.html
git commit -m "feat(01-house): architectural shell — plinth, wall depth, roof fascia/soffit, paver terrace, pool"
```

---

### Task 5: Glazing — physically-based glass with mullion grid (+ cheap fallback)

**Files:**
- Modify: `designs/01-house-walkthrough/index.html` — extend `SECTION: house`

- [ ] **Step 5.1: Append the glazing builder** after `buildTerrace()`:

```js
(function buildGlazing() {
  // Physical glass: real fresnel reflections + transmission on hardware GPUs.
  // Transmission re-renders the scene into a buffer — too heavy for SwiftShader,
  // so the shot harness path falls back to a transparent standard material.
  const glass = SOFT_GPU
    ? new THREE.MeshStandardMaterial({ color: '#cfe0e4', roughness: 0.04, metalness: 0,
        transparent: true, opacity: 0.14, envMapIntensity: 1.2, side: THREE.DoubleSide })
    : new THREE.MeshPhysicalMaterial({ color: '#eef4f4', roughness: 0.03, metalness: 0,
        transmission: 1, thickness: 0.02, ior: 1.52, envMapIntensity: 1.0, side: THREE.DoubleSide });
  const frame = M.steel;
  // one glazed bay = glass pane + surrounding slim frame profiles, recessed by `inset`
  function bay(w, h, x, y, z, { rotY = 0, inset = 0.12 } = {}) {
    const g = new THREE.Group();
    const pane = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, h - 0.06, 0.02), glass);
    pane.castShadow = false; pane.receiveShadow = false;
    g.add(pane);
    for (const [fw, fh, fx, fy] of [[w, 0.07, 0, h / 2], [w, 0.07, 0, -h / 2], [0.07, h, -w / 2, 0], [0.07, h, w / 2, 0]]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.08), frame);
      f.position.set(fx, fy, 0); f.castShadow = false;
      g.add(f);
    }
    g.position.set(x, y, z); g.rotation.y = rotY;
    g.position.z -= Math.cos(rotY) * inset; g.position.x -= Math.sin(rotY) * inset;
    root.add(g);
  }
  // south facade: 3 full-height bays between the steel piers (piers at -6.2,-2.1,2.1,6.2)
  bay(4.1, 3.2, -4.15, 1.6, 4.12);
  bay(4.2, 3.2, 0, 1.6, 4.12);
  bay(4.1, 3.2, 4.15, 1.6, 4.12);
  // east opening: one wide bay in the recessed reveal
  bay(2.9, 3.2, 6.2, 1.6, 0.35, { rotY: Math.PI / 2, inset: 0.14 });
  // west clerestory slot
  bay(8, 0.32, -6.2, 2.49, 0, { rotY: Math.PI / 2, inset: 0.1 });
  // upper ribbon window (gap left by Task 4's sill/header/piers: y 4.2±0.7, x -5.75..0.15)
  bay(5.9, 1.38, -2.8, 4.19, 2.2, { inset: 0.1 });
})();
```

- [ ] **Step 5.2: Verify**

```bash
SHOT_POS="0,0.35,1" bash tools/shot.sh http://localhost:8123/designs/01-house-walkthrough/ house-t5 1600 900
```
Expected: no console errors. Checklist:
- Glass shows the sky/environment as a reflection AND lets the interior read through (fallback material in headless shots: faint transparency is acceptable — final judgement on real GPU happens in Task 9).
- Frames read as slim dark profiles, glazing sits visibly BEHIND the pier face (reveal shadow).
- No z-fighting flicker between pane and frames across the three shots.

- [ ] **Step 5.3: Commit**

```bash
git add designs/01-house-walkthrough/index.html
git commit -m "feat(01-house): physically-based glazing with recessed bays and mullion frames"
```

---

### Task 6: Interior + garden — photoscanned furniture, trees, hedges

**Files:**
- Modify: `designs/01-house-walkthrough/index.html` — fill `SECTION: interior` and `SECTION: garden`

- [ ] **Step 6.1: Fill `SECTION: interior`:**

```js
// SECTION: interior — Poly Haven photoscans; real-scale GLTFs, origin at floor.
// Living zone (west, in front of the glass), dining east, kitchen island at the core wall.
loadModel('./models/sofa_03/sofa_03.gltf',               { x: -3.6, z: 1.6, ry: Math.PI });
loadModel('./models/ArmChair_01/ArmChair_01.gltf',       { x: -1.4, z: 0.6, ry: -Math.PI / 3 });
loadModel('./models/coffee_table_round_01/coffee_table_round_01.gltf', { x: -2.9, z: 0.2 });
loadModel('./models/dining_table/dining_table.gltf',     { x: 3.4, z: 0.6 });
for (const [dx, dz, r] of [[-0.9, -0.8, 0], [0.1, -0.8, 0], [1.0, -0.8, 0],
                            [-0.9, 1.9, Math.PI], [0.1, 1.9, Math.PI], [1.0, 1.9, Math.PI]]) {
  loadModel('./models/dining_chair_02/dining_chair_02.gltf', { x: 3.4 + dx - 0.05, z: 0.6 + dz, ry: r });
}
loadModel('./models/anthurium_botany_01/anthurium_botany_01.gltf', { x: 5.4, z: -3.2 });
loadModel('./models/anthurium_botany_01/anthurium_botany_01.gltf', { x: -5.6, z: 3.0, ry: 2.1 });

// kitchen island (procedural — no fitting CC0 model): stone top on an oak body
const rbox = (w, h, d, r, mat, x, y, z) => {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat);
  m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true;
  root.add(m); return m;
};
const oak = new THREE.MeshStandardMaterial({ color: '#7d6547', roughness: 0.7 });
const stone = new THREE.MeshStandardMaterial({ color: '#dcd8d0', roughness: 0.25 });
rbox(2.6, 0.9, 1.1, 0.02, oak, -3.4, 0, -0.9);
rbox(2.72, 0.05, 1.22, 0.01, stone, -3.4, 0.9, -0.9);

// pendant cluster over the dining table — shades glow at night (Task 7 wires the light)
const pendantShadeMat = new THREE.MeshStandardMaterial({ color: '#1f1d1a', roughness: 0.4, metalness: 0.6, emissive: '#ffc478', emissiveIntensity: 0 });
for (const dx of [-0.6, 0, 0.6]) {
  const drop = 1.05 - Math.abs(dx) * 0.25;
  box(0.015, drop, 0.015, M.steel, 3.4 + dx, 3.2 - drop, 0.6, { cast: false });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.18, 24, 1, true), pendantShadeMat);
  shade.position.set(3.4 + dx, 3.2 - drop - 0.02, 0.6);
  shade.castShadow = true; root.add(shade);
}

// upstairs: low bed silhouette only (barely visible from the eye-level path)
rbox(2.2, 0.32, 1.8, 0.04, new THREE.MeshStandardMaterial({ color: '#cfc8b8', roughness: 0.95 }), -3.4, 3.55, -2.2);
```

- [ ] **Step 6.2: Fill `SECTION: garden`:**

```js
// SECTION: garden — photoscanned trees frame the composition; clipped hedges line the terrace.
gltfLoader.load('./models/island_tree_02/island_tree_02_1k.gltf', (gltf) => {
  const proto = gltf.scene;
  proto.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true; o.receiveShadow = true;
      if (o.material && o.material.transparent) {
        o.material.alphaTest = 0.5; o.material.transparent = false;
        o.material.side = THREE.DoubleSide; o.material.depthWrite = true;
      }
    }
  });
  const bb = new THREE.Box3().setFromObject(proto);
  const height = bb.max.y - bb.min.y;
  // 4 placements: frame the hero views (SE + W), never block the facade
  for (const [tx, tz, sMul, seed] of [[-16, 12, 1.0, 0.17], [16, -8, 1.1, 0.61], [-18, -8, 0.85, 0.39], [20, 11, 0.9, 0.83]]) {
    const t = proto.clone();
    const k = (7 * sMul) / height;
    t.scale.setScalar(k);
    t.position.set(tx, -0.12 - bb.min.y * k, tz);
    t.rotation.y = seed * 6.28;
    root.add(t);
  }
});
// clipped hedges flanking the terrace steps
const hedgeMat = new THREE.MeshStandardMaterial({ color: '#3c5230', roughness: 0.95 });
for (const hx of [-6.6, 7.6]) rbox(2.8, 0.65, 0.7, 0.16, hedgeMat, hx, -0.12, 8.6);
```

- [ ] **Step 6.3: Verify**

```bash
SHOT_POS="0,0.2,0.45" bash tools/shot.sh http://localhost:8123/designs/01-house-walkthrough/ house-t6 1600 900
```
Expected: no console errors, loader completes (LoadingManager gates on all GLTFs). Checklist:
- Furniture reads photoreal through the glass: sofa/armchair/dining set have real proportions and texture detail; no model floating or intersecting walls (adjust x/z if the screenshot shows collisions — the GLTF footprints are only known at runtime).
- Dining chairs face the table; plant adds a green accent indoors.
- Trees frame the composition at t=0 without covering the facade.
- If a model looks grossly mis-scaled (>2× off), check the console for load errors first, then the `scale` option.

- [ ] **Step 6.4: Commit**

```bash
git add designs/01-house-walkthrough/index.html
git commit -m "feat(01-house): photoscanned furniture interior + framing trees and hedges"
```

---

### Task 7: Night practicals — pendants, eave wash, pool light, lantern payoff

**Files:**
- Modify: `designs/01-house-walkthrough/index.html` — fill `SECTION: practicals`, wire `SECTION: applyDay-practicals`

- [ ] **Step 7.1: Replace the `practicals` placeholder** at `SECTION: practicals` with:

```js
// SECTION: practicals — everything that turns ON as the sun dies. Real lights, no emissive-wall fakes.
const practicals = { pendants: [], fills: [], eaves: [], pool: null, dayFill: null };
{
  const p = new THREE.PointLight('#ffc478', 0, 7, 2);       // pendant cluster over dining
  p.position.set(3.4, 2.0, 0.6);
  scene.add(p); practicals.pendants.push(p);
  for (const [x, y, z] of [[-3.2, 2.3, 0.8], [-3.4, 5.2, -2.0]]) {   // living + bedroom fill
    const f = new THREE.PointLight('#ffd9a4', 0, 11, 2);
    f.position.set(x, y, z);
    scene.add(f); practicals.fills.push(f);
  }
  for (const ex of [-4.8, 1.2]) {                            // eave downlights wash the south facade
    const s = new THREE.SpotLight('#ffdcae', 0, 9, 0.9, 0.5, 1.8);
    s.position.set(ex, 3.1, 3.6); s.target.position.set(ex, 0, 4.4);
    scene.add(s, s.target); practicals.eaves.push(s);
  }
  const pl = new THREE.PointLight('#6fc3e8', 0, 6, 2);       // pool underwater glow
  pl.position.set(3.6, 0.3, 6.9);
  scene.add(pl); practicals.pool = pl;
  const df = new THREE.PointLight('#fff2e0', 1.2, 14, 2);    // daytime sky-bounce under the roof
  df.position.set(0, 2.4, 0.5);
  scene.add(df); practicals.dayFill = df;
}
```

- [ ] **Step 7.2: Wire the intensities** — replace the `// SECTION: applyDay-practicals` comment line inside `applyDay()` with:

```js
  for (const p of practicals.pendants) p.intensity = pt * 6;
  for (const f of practicals.fills) f.intensity = pt * 9;
  for (const s of practicals.eaves) s.intensity = pt * 25;
  practicals.pool.intensity = pt * 12;
  practicals.dayFill.intensity = 1.2 * (1 - pt);
  pendantShadeMat.emissiveIntensity = pt * 3.5;
```

Note: `pendantShadeMat` is declared in Task 6 (Step 6.1) at `SECTION: interior`. If executing tasks out of order, Task 7 requires Task 6 first — declare-before-use runs top-down in this file because `applyDay()` only executes from the render loop / init call, both at the bottom.

- [ ] **Step 7.3: Verify the night arc**

```bash
SHOT_POS="0.6,0.8,1" bash tools/shot.sh http://localhost:8123/designs/01-house-walkthrough/ house-t7 1600 900
```
Expected: no console errors. Checklist:
- t=0.6 (golden hour): first hints of interior warmth, sun low and warm from the west.
- t=0.8 (blue hour): house clearly glowing from within, eave spots washing the facade, pool cyan accent against the warm interior — the money shot.
- t=1 (night): lantern payoff — warm interior through glass, stars, NO salmon-colored walls (interior should read cream/amber), lawn properly dark.

- [ ] **Step 7.4: Commit**

```bash
git add designs/01-house-walkthrough/index.html
git commit -m "feat(01-house): night practicals — pendants, eave wash, pool light"
```

---

### Task 8: Post chain + camera polish — GTAO, bloom balance, path framing

**Files:**
- Modify: `designs/01-house-walkthrough/index.html` — `SECTION: gtao` + camera curve tuning

- [ ] **Step 8.1: Insert GTAO** — replace the `// SECTION: gtao` comment with:

```js
// GTAO grounds every contact (furniture→floor, plinth→lawn, reveals) — the single
// biggest "renders like archviz" post lever. Skipped on software rasterizers: the
// depth/normal prepass is brutal on SwiftShader and shots only need composition.
let gtao = null;
if (!SOFT_GPU) {
  gtao = new GTAOPass(scene, camera, innerWidth, innerHeight);
  gtao.output = GTAOPass.OUTPUT.Default;
  composer.addPass(gtao);
}
```

and extend `resize()` with:

```js
  if (gtao) gtao.setSize(w, h);
```

- [ ] **Step 8.2: Camera framing pass** — this step is *judgement, not code*: run the sweep below, view all 6 shots, and adjust `eye`/`aim` control points until every frame passes the checklist. Iterate shot→look→nudge (expect 2–4 rounds).

```bash
SHOT_POS="0,0.2,0.4,0.6,0.8,1" bash tools/shot.sh http://localhost:8123/designs/01-house-walkthrough/ house-t8 1600 900
```
Checklist per frame:
- House never exits the frame; no keyframe puts geometry between camera and aim (no clipping through hedges/trees/walls).
- Horizon stays in the middle third (eye-level feel); roofline never crosses the top edge except in the pool close-up.
- t=0.4 pool shot: water reflections + facade visible together.
- t=0.8: symmetric-ish frontal south elevation.
- The `.panel` copy positions (left/right alternating) don't cover the house at their scroll positions.

- [ ] **Step 8.3: Commit**

```bash
git add designs/01-house-walkthrough/index.html
git commit -m "feat(01-house): GTAO pass + camera framing polish"
```

---

### Task 9: Full verification, performance guard, poster, docs

**Files:**
- Modify: `PLAN.md` (outcome entry), `assets/posters/01-house-walkthrough.png` (regenerated)

- [ ] **Step 9.1: Full sweep + FPS regression check** (compare against Task 0 baseline)

```bash
SHOT_POS="0,0.15,0.3,0.45,0.6,0.75,0.9,1" bash tools/shot.sh http://localhost:8123/designs/01-house-walkthrough/ house-final 1600 900
```
Expected: `OK — no console errors`; `avgFps` within ~40% of the Task 0 baseline (SwiftShader lower bound — the scene got heavier, some drop is expected; a collapse to near-zero means the SOFT_GPU fallbacks aren't firing). View ALL 8 shots against the bar: "would a layperson believe this is a rendered photo of a real house?" Fix what fails before proceeding.

- [ ] **Step 9.2: Reduced-motion + resize spot check**

```bash
SHOT_POS="0.5" SHOT_FPS=0 bash tools/shot.sh http://localhost:8123/designs/01-house-walkthrough/ house-final-narrow 900 1600
```
Expected: no errors; portrait aspect doesn't break the framing catastrophically (house visible, no stretched sky).

- [ ] **Step 9.3: Regenerate the gallery poster**

```bash
POSTER_BASE=http://localhost:8123/designs/ bash tools/poster.sh 01-house-walkthrough
```
Expected: `assets/posters/01-house-walkthrough.png` updated; view it — poster should show the daylight hero (pos 0.05 per poster.mjs JOBS).

- [ ] **Step 9.4: PLAN.md outcome entry** — append a dated entry to the log section of `PLAN.md` (follow the existing entry style around line 348) covering: full scene rebuild (user mandate "0 realitätsnah → krass hinkriegen"), the six realism levers (AgX + GTAO, live sky-baked IBL, eye-level 38° path, layered lawn, wall-depth architecture + physical glass, Poly Haven furniture), what was dropped (dust motes, RoomEnvironment, emissive-wall lantern fake, aerial_grass_rock ground), and the SwiftShader fallbacks (SOFT_GPU: cheap glass, no GTAO, 7k grass, 1k shadows).

- [ ] **Step 9.5: Final commit**

```bash
git add PLAN.md assets/posters/01-house-walkthrough.png
git commit -m "docs(01-house): log realism rebuild outcome + regenerate poster"
```

- [ ] **Step 9.6: Report** — surface to the user: shots from `tools/shots/house-final/`, FPS numbers vs baseline, and the note that final glass/GTAO quality needs a real-GPU check in their browser (`http://localhost:8123/designs/01-house-walkthrough/`) since the harness is software-rendered. Merge/push only on the user's go.

---

## Self-review notes

- **Spec coverage:** lawn (Task 3), house realism (Tasks 4–5), interior (Task 6), day/night arc kept (Task 2 stops + Task 7 practicals), camera ride kept but re-authored (Task 2 + 8), verification (every task + Task 9). Poster + docs per repo convention (Task 9).
- **Consistency check:** `SOFT_GPU`, `prng`, `pbr`, `loadModel`, `box` (Task 4, used by Tasks 6–7), `rbox` (Task 6), `M.*` (Task 4, used by 5–6), `practicals` (placeholder Task 2, replaced Task 7), `pendantShadeMat` (Task 6 → Task 7), `grassWind` (Task 3 both halves), `bloom` referenced by `applyDay` (both Task 2). `mergeGeometries` imported in Task 2, used in Task 3. `GTAOPass` imported in Task 2, used in Task 8.
- **Known judgement points (not placeholders — genuinely visual):** furniture collision nudges (6.3), camera framing rounds (8.2), lawn tint (3.3). Each has a concrete checklist and iteration loop via the shot harness.

## Outcome (2026-07-05)

All 9 tasks (Task 0 branch/baseline through Task 9 verification + docs) were implemented. The
scene now matches this plan's six-lever architecture: eye-level 38° camera rig, AgX + GTAO
(hardware-gated) + live sky-baked PMREM IBL, layered instanced-blade lawn, wall-depth architecture
with recessed transmission glazing, Poly Haven furniture, and real night practicals replacing the
old emissive-wall lantern fake.

Key deviations from the written plan:
- `leafy_grass` (Task 1's planned texture) was swapped for ambientCG's `grass001` — better
  anti-tiling behavior at the macro-resample scale actually used.
- The two paver "step down to lawn" boxes (Task 4) were dropped in favor of a single 12 cm curb —
  the two-step version read as an odd little staircase at eye level, not a terrace edge.
- Pool coping (Task 4) was rebuilt as a proper frame (four boxes forming a ring) instead of the
  single flat coping slab in the plan — the slab occluded the water plane from most camera angles.
- The upper ribbon-window bay (Task 5) moved from y=4.19 to y=4.9 to clear the sill/header bands
  actually placed in Task 4 (the plan's coordinates were pre-build estimates).
- The east bay (Task 5) widened from 2.9 to 3.7 m to close a sliver gap left by the as-built east
  wall opening.
- Brightness calibration (Task 2 stops) needed `expo` around 3.4 at t=0, not the plan's placeholder
  1.45 — AgX under this scene's actual light levels reads much darker than expected at exposure 1.
- A floor-edge trim strip was added along the south facade (not in the plan) to hide a visible
  seam between the plinth and the terrace pavers.
- The shot harness (`tools/shot.mjs`) gained a loader-overlay wait, unplanned but necessary once
  GLTF/texture loads started occasionally racing the first screenshot.

Open points:
- Real-GPU verification is still outstanding for everything hardware-gated: GTAO, the physical
  `MeshPhysicalMaterial` transmission glass, and the exposure/brightness calibration (all three
  were tuned or written against SwiftShader's SOFT_GPU fallback path only, which never executes
  them).
- `ArmChair_01` (Poly Haven) reads stylistically baroque/ornate next to the otherwise minimalist
  modern furniture set — a candidate for a future swap once a more matching CC0 armchair is found.
- SwiftShader FPS numbers from this harness are a software-render lower bound only, not a
  meaningful performance signal — real-GPU frame timing is unverified.
