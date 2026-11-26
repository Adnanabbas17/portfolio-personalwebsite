// Motion: Lenis smooth scroll + GSAP ScrollTrigger.
// Every animation here has a reason (see CLAUDE.md). Only transform and opacity animate.

// JS-side motion constants. CSS-side durations and easing live in styles.css (:root).
export const MOTION = {
  lenisDuration: 1.1,          // seconds for wheel and anchor scrolls
  tiltMax: 5,                  // degrees, Work panel hover tilt
};

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Pinned library versions (also listed in CLAUDE.md and the CSP in netlify.toml).
const CDN = 'https://cdn.jsdelivr.net/npm';
export const LIBS = {
  gsap: `${CDN}/gsap@3.15.1/dist/gsap.min.js`,
  scrollTrigger: `${CDN}/gsap@3.15.1/dist/ScrollTrigger.min.js`,
  lenis: `${CDN}/lenis@1.3.27/dist/lenis.min.js`,
  phosphor: `${CDN}/@phosphor-icons/web@2.1.2/src/regular/style.css`,
};

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export function loadStylesheet(href) {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  document.head.appendChild(l);
}

// Smooth scroll, pinning and the 3D object only exist on desktop fine pointers.
// Touch devices keep native scrolling (Lenis does not smooth touch by default anyway),
// so phones never download GSAP or Lenis.
export const isDesktopPointer = () =>
  window.matchMedia('(pointer: fine) and (min-width: 768px)').matches;

let lenis = null;

function initSmoothScroll() {
  const { gsap, ScrollTrigger, Lenis } = window;
  if (!Lenis || !gsap || !ScrollTrigger) return;

  lenis = new Lenis({
    duration: MOTION.lenisDuration,
    easing: (t) => 1 - Math.pow(1 - t, 4),
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // In-page anchors go through Lenis so they share the same easing.
  // Lenis honours the CSS scroll-padding-top (header height), so no offset here.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    lenis.scrollTo(target, {
      onComplete: () => {
        if (target instanceof Element) {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      },
    });
    history.pushState(null, '', id);
  });
}

function initHeroScroll(onHeroProgress) {
  const { ScrollTrigger } = window;
  const heroEl = document.querySelector('.hero');
  if (!ScrollTrigger || !heroEl || !onHeroProgress) return;
  ScrollTrigger.create({
    trigger: heroEl,
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => onHeroProgress(self.progress),
  });
}

/* ---------- Section reveals: fade and rise once on entry ---------- */
function initReveals() {
  const items = [...document.querySelectorAll('[data-reveal]')];
  if (!items.length) return;
  // Stagger siblings that share a parent (e.g. bento cells).
  const groups = new Map();
  items.forEach((el) => {
    const n = groups.get(el.parentElement) || 0;
    el.style.setProperty('--reveal-i', String(n));
    groups.set(el.parentElement, n + 1);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  items.forEach((el) => io.observe(el));
}

/* ---------- Work: sticky stage that crossfades to the project in focus ---------- */
function buildStage(stage, entries) {
  const frame = document.createElement('div');
  frame.className = 'stage-frame';
  const captions = document.createElement('div');
  captions.className = 'stage-captions';

  entries.forEach((entry) => {
    const layer = document.createElement('div');
    layer.className = 'stage-layer';
    const media = entry.querySelector('.work-media > img, .work-media > .placeholder');
    if (media) {
      const clone = media.cloneNode(true);
      clone.removeAttribute('role');
      clone.removeAttribute('aria-label');
      if (clone.tagName === 'IMG') clone.alt = '';
      layer.appendChild(clone);
    }
    frame.appendChild(layer);

    const caption = document.createElement('div');
    caption.className = 'stage-caption';
    const name = document.createElement('p');
    name.className = 'stage-name';
    name.textContent = entry.querySelector('.work-name')?.textContent ?? '';
    const org = document.createElement('p');
    org.className = 'stage-org';
    org.textContent = (entry.querySelector('.work-org')?.textContent ?? '').split(' · ')[0];
    caption.append(name, org);
    captions.appendChild(caption);
  });

  stage.replaceChildren(frame, captions);
  return { layers: [...frame.children], captions: [...captions.children] };
}

function initWork() {
  const { ScrollTrigger } = window;
  const layout = document.querySelector('[data-work]');
  const stage = layout?.querySelector('[data-work-stage]');
  const entries = [...(layout?.querySelectorAll('[data-work-entry]') ?? [])];
  if (!layout || !stage || !entries.length || !ScrollTrigger) return;

  const mq = window.matchMedia('(min-width: 1024px)');
  let triggers = [];
  let current = -1;
  let parts = null;

  const setActive = (i) => {
    if (i === current || !parts) return;
    current = i;
    parts.layers.forEach((el, n) => el.classList.toggle('is-active', n === i));
    parts.captions.forEach((el, n) => el.classList.toggle('is-active', n === i));
  };

  const enable = () => {
    parts = parts || buildStage(stage, entries);
    layout.classList.add('is-pinned');
    current = -1;
    setActive(0);
    triggers = entries.map((entry, i) => ScrollTrigger.create({
      trigger: entry,
      start: 'top 60%',
      end: 'bottom 60%',
      onToggle: (self) => { if (self.isActive) setActive(i); },
      // Fast jumps can skip a toggle: snap to the first or last entry at the ends.
      onLeaveBack: i === 0 ? () => setActive(0) : undefined,
      onLeave: i === entries.length - 1 ? () => setActive(i) : undefined,
    }));
    ScrollTrigger.refresh();
  };
  const disable = () => {
    triggers.forEach((t) => t.kill());
    triggers = [];
    layout.classList.remove('is-pinned');
    ScrollTrigger.refresh();
  };

  if (mq.matches) enable();
  mq.addEventListener('change', (e) => (e.matches ? enable() : disable()));
}

/* ---------- Work panels: subtle 3D tilt on hover (fine pointers only) ---------- */
function initTilt() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    let raf = 0;
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `perspective(1000px) rotateX(${(-y * MOTION.tiltMax).toFixed(2)}deg) rotateY(${(x * MOTION.tiltMax).toFixed(2)}deg)`;
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      card.style.transform = '';
    });
  });
}

export async function initMotion({ onHeroProgress } = {}) {
  if (prefersReducedMotion()) return;
  initReveals();
  initTilt();
  if (!isDesktopPointer()) return;
  try {
    await Promise.all([loadScript(LIBS.gsap), loadScript(LIBS.scrollTrigger), loadScript(LIBS.lenis)]);
  } catch {
    return; // CDN unavailable: native scrolling and the stacked Work layout remain.
  }
  window.gsap.registerPlugin(window.ScrollTrigger);
  initSmoothScroll();
  initHeroScroll(onHeroProgress);
  initWork();
}

