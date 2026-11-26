# CLAUDE.md: locked decisions for this site

Personal portfolio for Adnan Abbas. Read this before any change. These decisions are locked unless Adnan explicitly changes them. Inspect the existing implementation before modifying it, protect working functionality, and do not refactor unrelated code.

## Facts (use only these, never invent)
- Adnan Abbas, Malappuram, Kerala, India.
- AI educator and product builder. Runs AI literacy and prompt engineering workshops. 3000+ students mentored.
- Product Manager at Edapt Learning Technology (Calicut).
- Never mention educational qualifications anywhere.
- No invented metrics, clients, logos or testimonials. No fake screenshots built from divs.
- Unknown values are HTML comments (`<!-- TODO: ... -->`), never visible text.

## Design read
"Personal portfolio for people booking AI sessions (students, professionals, institutions, business teams) and for recruiters, with an Apple-style premium monochrome language, built with native HTML/CSS + GSAP ScrollTrigger + one Three.js object."
- Dials: DESIGN_VARIANCE 6 (asymmetric but calm), MOTION_INTENSITY 6 (smooth scroll, motivated reveals, one pinned section, one 3D object), VISUAL_DENSITY 2 (gallery whitespace, few words).
- References: apple.com MacBook Air buy page (primary: whitespace, two-tone headings, sticky split, grey rounded panels, black pills). nishadt.com only for the "one striking object + negative space" idea. ailutions.ai only for restraint. Never copy content, assets, logos or exact layouts.

## Theme and color
- One light theme on every section. No dark sections. No dark mode in v1 (tokens are ready for it).
- Tokens (the only colors allowed):
  - `--bg #FBFBFD` page
  - `--surface #F5F5F7` panels, bento cells, form panel
  - `--text #1D1D1F` text, buttons, error text
  - `--text-muted #6E6E73` second tone of headings, secondary text, small print, placeholders (4.66:1 on surface)
  - `--text-meta #86868B` INPUT BORDERS ONLY. It fails AA as text (3.3:1).
  - `--hairline #D2D2D7` dividers and panel borders (decorative only, not input borders)
  - `--accent #0066CC` inline text links and focus rings only
- No gradients except the soft shadow under the 3D object. No pure #000/#FFF surfaces. Shadow tint `rgba(29,29,31,0.06)` only.
- Errors: no red. `--text`, weight 500, Phosphor `warning-circle`, input border becomes 2px `--text`.
- Button hover: a `::after` layer of `--text` with `filter: brightness(0.6)`, faded with opacity (no new color literal).

## Typography
- DM Sans only, self-hosted variable woff2 (`/assets/fonts/dm-sans-latin-wght.woff2`, 400-700, SIL OFL, license in `assets/fonts/OFL.txt`), preloaded. Defined once as `--font-sans`.
- No Google Fonts `<link>`, no Inter, no Canva Sans, no second family, no italic serif accents.
- Hero headline: `clamp(40px, 9.1cqi, 64px)` on the copy column (container query). "I teach people to use AI." is 10.77em wide, so it always fits one line on desktop (62px at 1280 and 1440). Mobile is 40px and wraps to 3 lines by necessity.
- Section headings 32 / 44 / 48px, weight 600, -0.02em. Body 17px mobile, 19px desktop, line-height 1.5, max 60ch. Small print 12-13px.
- Two-tone headings: first phrase `--text`, second phrase `<span class="muted">`. Same size and weight.

## Shape
- Buttons: pill (999px). Panels and image frames: 24px. Inputs: 12px, min-height 48px.

## Icons
- Phosphor Icons regular only, `@phosphor-icons/web@2.1.2` from jsDelivr, loaded by `main.js` after first paint. Icons are decorative (`aria-hidden`), text labels carry meaning. No hand-drawn SVG icons, no emoji.

## Sections (5 + header, each a different layout family)
1. Header: 64px, wordmark left, Work + Contact, black pill "Book a session". Blur + hairline after scroll. Mobile uses a native `<details>` menu (works without JS).
2. Hero: asymmetric split 7fr/5fr. Max 4 text elements: eyebrow, headline, subtext (max 20 words), CTAs. 3D pebble right (~45%).
3. About: bento, exactly 4 cells (photo spanning 2 rows, 3000+, 5/5, text cell with hairline border). Single column under 768.
4. Work: the ONE pinned section. CSS `position: sticky` stage + ScrollTrigger picks the active entry and crossfades. Stacked (image above text, or beside at 1024+) on mobile, reduced motion and without JS. No counters, no labels on images. Project data is the `PROJECT DATA` block in `index.html`.
5. Book a session: centered 640px column, form in a surface panel, Netlify Forms.
6. Footer: hairline top, name + location left, Instagram / LinkedIn / email right, copyright.

Eyebrows: max 2 on the page ("AI educator · Product builder" in the hero, "Booking"). No section numbers, scroll cues, decorative dots, locale/time strips or version labels.

## CTA label lock
- Booking: "Book a session" (header + hero), "Send request" (form submit). Portfolio: "See my work". Thank-you page: "Back to home". No other CTA wording. No CTA wraps on desktop.

## 3D rules
- Exactly one Three.js object: a soft black satin pebble (`js/hero3d.js`). MeshPhysicalMaterial (near-black, roughness 0.55, clearcoat 1, clearcoatRoughness 0.18, low specularIntensity) lit by RoomEnvironment via PMREM (blur 0.07). No colored lights.
- Contact shadow is a CSS radial gradient div that scales with the float.
- Live only on desktop fine pointers (`(pointer: fine) and (min-width: 768px)`), never under reduced motion. Loaded after `load` + idle. DPR max 1.5. Pauses off-screen and on hidden tab. Falls back to the static render if average frame time > 45ms. Disposes on `pagehide`.
- Static fallback `assets/hero-object.webp` (+ `-600`) is a frame exported from the real scene. Shown on mobile, touch, reduced motion, no WebGL, no JS.
- Banned: particles, starfields, dot networks, wireframes, neon, glow, torus knots, multiple objects, color.

## Motion rules
- Only transform and opacity animate. Never `window.addEventListener('scroll')`; use ScrollTrigger, Lenis events or IntersectionObserver.
- Hero entrance: pure CSS keyframes (rise 16px, 800ms, `cubic-bezier(0.16,1,0.3,1)`, 80ms stagger) so text never waits on JS.
- Section reveals: IntersectionObserver + CSS transition, rise 24px, once.
- Lenis + GSAP/ScrollTrigger load only on desktop fine pointers (phones keep native scroll and never download them). Anchors scroll through Lenis, which honours `scroll-padding-top`.
- Work panel tilt: perspective 1000px, max 5 degrees, fine pointers only, eased return.
- Buttons: hover shade, `:active` scale(0.98). Links: underline scales in over 200ms.
- Durations/easing: CSS variables in `:root`, JS constants in `MOTION` (`js/motion.js`).
- No infinite loops except the 3D idle float. No marquees, bounce, or custom cursor.
- `prefers-reduced-motion`: no Lenis, reveals, pinning, tilt or 3D; static image; everything visible.

## Tech constraints
- Plain HTML + CSS + vanilla ES modules. No framework, no build step, no npm, no Tailwind.
- Allowed libraries only (pinned, jsDelivr): three@0.187.0 (+ RoomEnvironment), gsap@3.15.1 (+ ScrollTrigger), lenis@1.3.27, @phosphor-icons/web@2.1.2.
- Three.js comes through the inline importmap. Its sha256 is in the CSP in `netlify.toml`. Changing the importmap means recomputing the hash (command in README).
- No inline `style=""` attributes or inline scripts other than the importmap (CSP blocks them).
- Layout: CSS Grid, content max 1200px, 24px gutter on mobile (32px from 768). Breakpoints 640 / 768 / 1024 / 1280. Every multi-column layout declares its under-768 single-column fallback. Use `100dvh`, never `100vh`.
- Accessibility: semantic HTML, labels above inputs, help text and errors below, no placeholder-as-label, `--accent` focus rings, WCAG AA everywhere, all content usable without JS.

## Copy rules
- Plain, specific, human, short sentences. Facts above only.
- No em or en dashes in visible text. Max one middle dot per line.
- Banned words: unlock, elevate, empower, seamless, revolutionize, cutting-edge, harness, journey, game-changer, next-gen, "in today's fast-paced world".

## Git rules
- Repo: github.com/Adnanabbas17/portfolio-personalwebsite (public). Default branch `main`.
- Small, logical commits with clear messages.
- Never commit secrets, API keys, .env files, proprietary fonts, or Adnan's phone number.
- Ask Adnan before every push to `main`.
