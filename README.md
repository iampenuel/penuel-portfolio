# Penuel's Mac Portfolio

An Astro + React portfolio that behaves like Penuel Stanley-Zebulon's personal Mac desktop.

## Included in this starter

- Custom Penuel bear wallpaper
- macOS-style menu bar and live desktop clock
- Single-click folder selection and double-click opening
- Boot screen and typed welcome message
- Draggable, resizable, minimizable, maximizable, stackable windows
- Window restoration through the menu bar (no dock)
- Custom desktop right-click menu
- Curated daily Bible-verse rotation
- About Me window with delayed portrait reveal
- Finder-style Projects window
- Large in-desktop project detail window; no route change
- Experience, Leadership, Awards, and Certifications tabs
- Resume preview and PDF download
- GitHub and LinkedIn preview windows
- Responsive mobile fallback
- Silent interaction design

## Start locally

```bash
npm install
npm run dev
```

Open the local URL Astro prints in the terminal.

## Production check

```bash
npm run build
npm run preview
```

## Personal links

- GitHub: https://github.com/iampenuel
- LinkedIn: https://www.linkedin.com/in/penuel-stanley-zebulon/

## Important verse note

The curated rotation uses five ESV references with the required Crossway digital copyright notice available through the verse widget’s “ESV Scripture attribution” control.

## Main editing files

- `src/components/PortfolioDesktop.tsx` — desktop, windows, and interactions
- `src/styles/global.css` — all visual styling and responsive behavior
- `src/data/projects.ts` — project folders and project detail content
- `src/data/experience.ts` — experience, leadership, awards, and certifications
- `src/data/verses.ts` — curated verse rotation
- `public/assets/` — wallpaper, portraits, logos, and visual references
- `public/resume/` — resume PDF

## Embedded media easter egg

The desktop includes a deliberately understated “Definitely Important” folder. Its QuickTime-style window lazily embeds the official YouTube upload through the privacy-enhanced player host; no copyrighted video or audio is downloaded, proxied, or stored in this repository. Playback begins at 0:42 and stops at the 1:00 mark, with an accessible click-to-play fallback when sound autoplay is blocked and an in-window recovery state if the player is unavailable. Keyboard controls, minimized-window pausing, responsive sizing, and reduced-motion preferences are supported.

## Contact form

The menu-bar Contact action opens an in-site macOS Mail-style compose window. Form submissions are delivered through Formspree using the build-time `PUBLIC_FORMSPREE_FORM_ID` value. Copy `.env.example` to `.env.local` and set the value locally; configure the same variable for Vercel Production, Preview, and Development builds. The form validates names, email, and message length without leaving the desktop, preserves drafts across window changes, includes a hidden spam honeypot, and keeps a direct-email fallback available when delivery fails.

### Voice dictation and optional writing help

The Message field progressively enhances supported browsers with the Web Speech API. Dictation starts only after the visitor presses **Dictate**, the same control stops listening, finalized transcript text is appended to the editable draft, and interim text remains a temporary preview. The site does not use `MediaRecorder`, create an audio file, upload audio, or retain an audio recording. Speech recognition may be unavailable or may be handled remotely by the browser vendor; unsupported and denied-permission states leave normal typing fully usable.

The optional **Tidy message** menu sends only the Message text, the explicitly selected rewrite mode, and a random anonymous abuse-protection identifier to a separate Cloudflare Worker. First name, last name, email, other form fields, audio, IP addresses, and portfolio history are not included in the AI request or usage store. The Worker calls `@cf/google/gemma-4-26b-a4b-it` through a Workers AI binding named `AI`; no Cloudflare credential exists in browser code or Vercel.

Every AI rewrite is a suggestion. The original remains visible and unchanged while the request runs and during review. Visitors can use, edit, reject, or undo a suggestion, and AI never submits the contact form. Only the final human-approved contact fields are sent through Formspree.

The Worker lives in `workers/message-polisher/` and includes strict request validation, explicit CORS origins, response validation, a kill switch, a SQLite-backed Durable Object for exact UTC usage accounting, and Cloudflare rate-limit bindings for burst protection. It stores only anonymous salted hashes and counters. The global AI request cap is fixed at 200 successful requests per UTC day. The project is free-plan-only: Workers Paid, pay-as-you-go billing, and automatic paid fallbacks must not be enabled. On Workers Free, exhausted Workers AI or Durable Object allocations fail closed and the contact form continues without AI.

Environment variables and secrets:

- Portfolio build: `PUBLIC_FORMSPREE_FORM_ID` and the public `PUBLIC_AI_POLISH_ENDPOINT` URL ending in `/polish`.
- Worker variable: `AI_POLISH_ENABLED=true`.
- Worker secrets: `RATE_LIMIT_SALT` and `ADMIN_USAGE_TOKEN`. Never put these in Vercel, `.env.example`, source control, logs, or browser code.

Validate and deploy the Worker only after confirming the Cloudflare account is on Workers Free and Workers Paid is disabled:

```bash
cd workers/message-polisher
npm ci
npm run check
npx wrangler secret put RATE_LIMIT_SALT
npx wrangler secret put ADMIN_USAGE_TOKEN
npx wrangler deploy
```

Set the resulting `/polish` URL as `PUBLIC_AI_POLISH_ENDPOINT` for Vercel Production, Preview, and Development, then trigger a new Vercel build because Astro embeds public variables at build time. For local frontend testing, put the public endpoint in the ignored `.env.local` file.

Disable AI polishing without changing source code by setting `AI_POLISH_ENABLED` to `false` in the Cloudflare dashboard under the Worker’s Variables and Secrets, or from `workers/message-polisher/` with:

```bash
npx wrangler deploy --var AI_POLISH_ENABLED:false
```

The kill switch prevents model calls and leaves typing, browser dictation, and Formspree submission available. Check the protected aggregate usage endpoint without exposing the token:

```bash
curl -H "Authorization: Bearer $ADMIN_USAGE_TOKEN" https://<worker-host>/admin/usage
```

AI limits, free-quota exhaustion, invalid responses, and model failures never replace or clear the visitor’s draft. Automated tests mock Workers AI and do not consume live quota.

## Deployment

This is a static Astro project and can be deployed to Vercel, Netlify, Cloudflare Pages, or GitHub Pages after updating `site` in `astro.config.mjs`.
