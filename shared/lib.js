// Shared stack helpers for showroom designs. Keep this small and stable —
// scene / composer / loaders are built per-design (they vary too much to abstract).
import * as THREE from 'three';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

gsap.registerPlugin(ScrollTrigger);

export { THREE, gsap, ScrollTrigger };
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// WebGLRenderer with sane defaults: capped DPR, filmic tone mapping, sRGB out.
export function makeRenderer(opts = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', ...opts });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const el = renderer.domElement;
  el.classList.add('bg');
  document.body.appendChild(el);
  return renderer;
}

// True when the WebGL2 context is a software rasterizer (SwiftShader/llvmpipe), which is what
// headless Chromium (our own shot.mjs harness) always runs on. Measured: a multisampled render
// target that's cheap on real GPU hardware made even a trivial scene ~9x slower per frame under
// SwiftShader, and hung the actual production designs' screenshot capture outright (composer
// backlog never drains). Real GPUs resolve MSAA in dedicated hardware — this is a SwiftShader-only
// escape hatch, not a general antialias toggle.
function isSoftwareRenderer(renderer) {
  const gl = renderer.getContext();
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const info = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  return /swiftshader|llvmpipe|software/i.test(info);
}

// EffectComposer with a real multisampled render target — `antialias:true` on the renderer
// context is a no-op once a design routes through EffectComposer (its default render target
// has no MSAA, see three's EffectComposer source). WebGL2 lets a WebGLRenderTarget itself carry
// `samples`; the renderer resolves the multisampled buffer automatically when a later pass
// samples the texture. Falls back to a plain (non-MSAA) target on WebGL1 or software rasterizers.
// `msaa: false` lets a design's quality tier opt out of the multisampled target
// (real weak GPUs, not just software rasterizers) — the target is created once,
// so this is a startup decision, not a live-switchable one.
export function makeComposer(renderer, { msaa = true } = {}) {
  const size = renderer.getSize(new THREE.Vector2());
  const pixelRatio = renderer.getPixelRatio();
  // ?nomsaa — diagnostic escape hatch: lets us A/B a suspected multisample-resolve
  // driver artifact (e.g. black blocks on some ANGLE/D3D11 configs) without a rebuild
  const noMsaa = new URLSearchParams(location.search).has('nomsaa');
  const samples = msaa && renderer.capabilities.isWebGL2 && !isSoftwareRenderer(renderer) && !noMsaa ? 4 : 0;
  const target = new THREE.WebGLRenderTarget(size.width * pixelRatio, size.height * pixelRatio, {
    type: THREE.HalfFloatType,
    samples,
  });
  return new EffectComposer(renderer, target);
}

// Shared chromatic-aberration / vignette / grain color-grade pass, extracted from the
// near-identical `Grade` ShaderPass duplicated across 02/03/21. `heat` opts into 21's extra
// warm-tint + heat-tightened vignette driven by a `uHeat` uniform (0 = off).
export function makeGradePass({ aberration = 0.0015, vignetteMin = 0.6, grain = 0.025, heat = false } = {}) {
  const uniforms = { tDiffuse: { value: null }, uTime: { value: 0 }, uAberr: { value: aberration } };
  if (heat) uniforms.uHeat = { value: 0 };
  const vignette = heat
    ? `smoothstep(0.95, 0.16, r2*(2.0+uHeat*1.0))`
    : `smoothstep(0.9, 0.2, r2*2.2)`;
  const Grade = {
    uniforms,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uAberr; ${heat ? 'uniform float uHeat;' : ''} varying vec2 vUv;
      float rand(vec2 c){ return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453); }
      void main(){ vec2 d=vUv-0.5; float r2=dot(d,d);
        vec2 off=d*uAberr*(1.0+r2*3.0);
        vec3 col; col.r=texture2D(tDiffuse,vUv+off).r; col.g=texture2D(tDiffuse,vUv).g; col.b=texture2D(tDiffuse,vUv-off).b;
        ${heat ? 'col *= mix(vec3(1.0), vec3(1.1,0.93,0.8), uHeat);' : ''}
        col *= mix(${vignetteMin.toFixed(2)}, 1.0, ${vignette});
        col += (rand(vUv+uTime)-0.5)*${grain};
        gl_FragColor=vec4(col,1.0); }`,
  };
  return new ShaderPass(Grade);
}

// Resource hygiene (PLAN.md's "no context loss" gate): frees GPU resources on pagehide so
// quick back/forward navigation between showpieces doesn't leak GPU memory, and recovers from
// WebGL context loss. Re-uploading every bespoke scene's GPU state by hand isn't worth it for
// a set of one-off showpieces, so a restored context just reloads the page.
// `extras` covers GPU state living outside the main scene graph: a Scene is
// traverse-disposed, a function is called (for mutable bindings like a swapped
// render target), anything else gets .dispose() if it has one.
export function attachLifecycle(renderer, scene, composer, extras = []) {
  const disposeScene = (s) =>
    s.traverse((obj) => {
      obj.geometry?.dispose?.();
      const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
      for (const mat of mats) {
        for (const key in mat) { const v = mat[key]; if (v?.isTexture) v.dispose(); }
        mat.dispose();
      }
    });
  const disposeAll = () => {
    if (scene) disposeScene(scene);
    for (const extra of extras) {
      if (typeof extra === 'function') extra();
      else if (extra?.isScene) disposeScene(extra);
      else extra?.dispose?.();
    }
    composer?.passes?.forEach((p) => p.dispose?.());
    composer?.dispose?.();
    renderer.dispose();
  };
  window.addEventListener('pagehide', disposeAll);
  renderer.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault());
  renderer.domElement.addEventListener('webglcontextrestored', () => location.reload());
  return disposeAll;
}

// Lenis smooth scroll wired into GSAP's single ticker. Exposes a deterministic
// window.__scrollTo(0..1) for the screenshot harness. Returns null under reduced-motion.
export function smoothScroll({ lerp = 0.1 } = {}) {
  const maxScroll = () => Math.max(0, document.body.scrollHeight - window.innerHeight);
  if (reducedMotion) {
    window['__scrollTo'] = (p) => window.scrollTo(0, maxScroll() * p);
    return null;
  }
  const lenis = new Lenis({ lerp });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window['__lenis'] = lenis;
  window['__scrollTo'] = (p) => lenis.scrollTo(maxScroll() * p, { immediate: true });
  return lenis;
}

// rAF loop that pauses when the tab is hidden. fn(elapsed, delta).
// Uses performance.now() (THREE.Clock is deprecated in r185+).
export function loop(fn) {
  let running = true, last = performance.now(), elapsed = 0;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) last = performance.now(); // drop the hidden gap so delta doesn't spike
  });
  function frame(now) {
    requestAnimationFrame(frame);
    if (!running) return;
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now; elapsed += delta;
    fn(elapsed, delta);
  }
  requestAnimationFrame(frame);
}

// Resize helper, throttled to one call per frame. cb(width, height).
export function onResize(cb) {
  let queued = false;
  window.addEventListener('resize', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; cb(window.innerWidth, window.innerHeight); });
  });
}

// Simple loader overlay control: returns {set(0..1), done()}.
export function loaderOverlay() {
  const el = document.querySelector('.loader');
  const fill = el?.querySelector('.bar > i');
  return {
    set: (p) => { if (fill) fill.style.width = `${Math.round(p * 100)}%`; },
    done: () => { el?.classList.add('hidden'); },
  };
}

export const clamp = (v, a, b) => THREE.MathUtils.clamp(v, a, b);
export const mapClamp = (v, a, b, c, d) =>
  THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(v, a, b, c, d), Math.min(c, d), Math.max(c, d));
