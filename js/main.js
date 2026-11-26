// Entry point. Everything here is progressive enhancement:
// the page is complete and usable without JavaScript.
import { initMotion, prefersReducedMotion } from './motion.js';

document.documentElement.classList.add('js');

/* ---------- Header: hairline + blur once the page scrolls ---------- */
function initHeader() {
  const header = document.querySelector('.site-header');
  const sentinel = document.querySelector('.top-sentinel');
  if (!header || !sentinel) return;
  new IntersectionObserver(([entry]) => {
    header.classList.toggle('is-scrolled', !entry.isIntersecting);
  }).observe(sentinel);

  // Close the mobile menu after choosing a link or pressing Escape.
  const menu = header.querySelector('.menu');
  if (!menu) return;
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) menu.open = false;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
  });
}

/* ---------- Hero 3D: desktop fine pointer only, after first paint ---------- */
const hero = { scene: null };

function canUseWebGL() {
  const desktop = window.matchMedia('(pointer: fine) and (min-width: 768px)').matches;
  if (!desktop || prefersReducedMotion()) return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function initHero3D() {
  const visual = document.querySelector('[data-hero-visual]');
  const mount = visual?.querySelector('[data-hero-object]');
  if (!visual || !mount || !canUseWebGL()) return;

  const load = () => {
    import('./hero3d.js')
      .then(({ createHeroScene }) => {
        hero.scene = createHeroScene({
          container: mount,
          shadow: visual.querySelector('[data-hero-shadow]'),
          onReady: () => visual.classList.add('is-live'),
          onFail: () => {
            visual.classList.remove('is-live');
            hero.scene = null;
          },
        });
      })
      .catch(() => { /* CDN unavailable: the static render stays. */ });
  };

  // Wait for the first paint so hero text is never blocked by WebGL.
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
  if (document.readyState === 'complete') idle(load, { timeout: 1500 });
  else window.addEventListener('load', () => idle(load, { timeout: 1500 }), { once: true });
}

initHeader();
initHero3D();
initMotion({ onHeroProgress: (p) => hero.scene?.setScrollProgress(p) });
