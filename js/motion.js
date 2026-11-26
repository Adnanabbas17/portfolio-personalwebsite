// Motion: Lenis smooth scroll + GSAP ScrollTrigger.
// Every animation here has a reason (see CLAUDE.md). Only transform and opacity animate.

export const MOTION = {
  ease: 'expo.out',            // close to cubic-bezier(0.16, 1, 0.3, 1)
  revealDuration: 0.9,
  revealDistance: 24,
  revealStagger: 0.08,
  crossfade: 0.6,
  tiltMax: 5,                  // degrees
  lenisDuration: 1.1,
};

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    lenis.scrollTo(target, {
      offset: id === '#top' ? 0 : -parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10),
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

export function initMotion({ onHeroProgress } = {}) {
  if (prefersReducedMotion()) return;
  const { gsap, ScrollTrigger } = window;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  initSmoothScroll();
  initHeroScroll(onHeroProgress);
}

export const getLenis = () => lenis;
