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

## Deployment

This is a static Astro project and can be deployed to Vercel, Netlify, Cloudflare Pages, or GitHub Pages after updating `site` in `astro.config.mjs`.
