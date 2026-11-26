// Entry point. Everything here is progressive enhancement:
// the page is complete and usable without JavaScript.
import { initMotion, prefersReducedMotion, isDesktopPointer, loadStylesheet, LIBS } from './motion.js';

document.documentElement.classList.add('js');
loadStylesheet(LIBS.phosphor);

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
  if (!isDesktopPointer() || prefersReducedMotion()) return false;
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

/* ---------- Booking form: inline validation, then a normal POST to Netlify ---------- */
const MESSAGES = {
  name: { valueMissing: 'Please enter your full name.' },
  email: {
    valueMissing: 'Please enter your email address.',
    typeMismatch: 'Please enter a valid email address, like name@example.com.',
  },
  phone: { patternMismatch: 'Please use digits, spaces and an optional + only.' },
  'session-type': { valueMissing: 'Please choose a session type.' },
  goal: { valueMissing: 'Please tell me what you want to get out of the session.' },
};
const PHONE_RE = /^[+]?[0-9 ()-]{6,20}$/;

function initBookingForm() {
  const form = document.querySelector('[data-booking-form]');
  if (!form) return;
  form.noValidate = true;   // we show our own inline messages
  const submit = form.querySelector('[data-submit]');
  const fields = [...form.querySelectorAll('input:not([type="hidden"]):not([name="bot-field"]), select, textarea')];
  let attempted = false;

  const errorFor = (el) => {
    const v = el.validity;
    const msgs = MESSAGES[el.name] || {};
    if (v.valueMissing) return msgs.valueMissing;
    if (v.typeMismatch) return msgs.typeMismatch;
    if (el.name === 'phone' && el.value.trim() && !PHONE_RE.test(el.value.trim())) return msgs.patternMismatch;
    return '';
  };

  const show = (el) => {
    const msg = errorFor(el);
    const box = document.getElementById(`${el.id}-error`);
    if (!box) return !msg;
    box.querySelector('span').textContent = msg;
    box.hidden = !msg;
    if (msg) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
    return !msg;
  };

  fields.forEach((el) => {
    const evt = el.tagName === 'SELECT' ? 'change' : 'blur';
    el.addEventListener(evt, () => { if (attempted || el.value) show(el); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid')) show(el); });
  });

  form.addEventListener('submit', (e) => {
    attempted = true;
    const invalid = fields.filter((el) => !show(el));
    if (invalid.length) {
      e.preventDefault();
      invalid[0].focus();
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Sending...';
  });

  // Restore the button if the visitor comes back with the browser's back button.
  window.addEventListener('pageshow', () => {
    submit.disabled = false;
    submit.textContent = 'Send request';
  });
}

function initYear() {
  const el = document.querySelector('[data-year]');
  if (el) el.textContent = String(new Date().getFullYear());
}

initHeader();
initBookingForm();
initYear();
initHero3D();
initMotion({ onHeroProgress: (p) => hero.scene?.setScrollProgress(p) });
