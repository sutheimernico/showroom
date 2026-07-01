// Shared stack helpers for showroom designs. Keep this small and stable —
// scene / composer / loaders are built per-design (they vary too much to abstract).
import * as THREE from 'three';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

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
