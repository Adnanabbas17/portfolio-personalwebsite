# Adnan Abbas · personal site

A single-page portfolio for Adnan Abbas, AI educator and product builder. It shows work programs, takes session bookings through a Netlify form, and links to Instagram.

Plain HTML, CSS and vanilla JS (ES modules). No build step and no npm install.

## Run it locally

From the repo root, use any static server:

```bash
npx serve .
```

or

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` straight from disk will not work, because the paths are root-relative (`/styles.css`).

The booking form only submits on Netlify. Locally, the submit button shows its "Sending..." state and the POST then fails, which is expected.

## Files

| Path | What it is |
|---|---|
| `index.html` | The whole page: header, hero, About, Work, Booking, footer |
| `styles.css` | Tokens (colors, shape, motion) and all styles |
| `js/main.js` | Header, mobile menu, booking form validation, lazy 3D loader |
| `js/motion.js` | Lenis smooth scroll, reveals, pinned Work section, tilt, pinned library URLs |
| `js/hero3d.js` | The Three.js pebble (desktop fine pointers only) |
| `thank-you.html` | Page shown after a booking request |
| `assets/` | Images, favicon, Open Graph image, fonts (DM Sans, SIL OFL) |
| `netlify.toml` | Publish settings and security headers (CSP) |
| `CLAUDE.md` | Locked design decisions. Read before changing anything. |

## Edit the Work projects

Open `index.html` and find the block marked `PROJECT DATA`. Each project is one `<li><article>`:

- `.work-org`: organization, then an optional short context after ` · `
- `.work-name`, `.work-role`, `.work-desc` (max 45 words), `.work-outcome` (one line)
- Leave a field out until it is confirmed. Never put "TODO" in visible text; use an HTML comment.

The sticky image panel on desktop is built from these entries automatically.

To add a project photo, save it as `/assets/work-N.webp` (16:10, 1600x1000) and replace the entry's `<div class="placeholder">` with the `<img>` tag shown in the comment above it. Write a real `alt` that describes the photo.

## Add your portrait

Save `/assets/adnan.webp` (1200x1500, natural light, plain background) and replace the placeholder in the About section with the `<img>` tag from the comment there.

## Updating a library version

Versions are pinned in two places:

- `js/motion.js` (`LIBS`): GSAP, ScrollTrigger, Lenis, Phosphor Icons
- `index.html` (the `importmap`): Three.js

If you change the importmap, recompute its hash and replace the `sha256-...` value in `netlify.toml`, or the browser will block it:

```bash
python3 -c "import re,hashlib,base64;s=open('index.html').read();m=re.search(r'<script type=\"importmap\">(.*?)</script>',s,re.S);print('sha256-'+base64.b64encode(hashlib.sha256(m.group(1).encode()).digest()).decode())"
```

To regenerate the static 3D fallback (`assets/hero-object.webp`), render the scene and call `snapshot()` from `createHeroScene` (see `js/hero3d.js`).

## Deploy

Netlify deploys automatically from GitHub. Every push to `main` goes live. Pushes to other branches can get their own preview URL (branch deploys). Settings live in `netlify.toml`: publish directory `.`, no build command.

Booking requests appear in Netlify under **Forms > booking**.
