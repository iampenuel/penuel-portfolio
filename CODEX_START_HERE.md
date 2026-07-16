# Codex Start Here

## Mission

Continue building Penuel Stanley-Zebulon's personal portfolio as an interactive MacBook-style desktop. Preserve the custom wallpaper, folder arrangement, faith element, and same-page window interactions.

## Non-negotiable product decisions

1. Desktop items use **single-click to select and double-click to open**.
2. No dock.
3. Silent interactions.
4. Support dragging, resizing, minimizing, maximizing, stacking, a menu bar, a boot animation, a live clock, and desktop right-click behavior.
5. Projects open first as a maximized Finder-style window.
6. Project folders open a larger project-detail window on the same desktop; never navigate to a separate route.
7. About Me reveals Penuel's portrait only while the About window is open.
8. Resume must support both in-browser viewing and PDF download.
9. Bible verses rotate daily from a curated list.
10. Desktop folder layout should match the supplied mockup: Projects/GitHub, About Me/LinkedIn, Experience, Resume.
11. Contact voice dictation uses only the browser Web Speech API; never record, upload, or store audio.
12. Browser code never receives Cloudflare credentials and sends only Message text to the AI Worker.
13. AI rewrites remain suggestions until explicit human approval, never submit automatically, and always preserve the original for rejection or Undo.
14. The message-polisher Worker must remain on Workers Free with the exact server-side usage guard and the 200-successful-request UTC daily cap. Never enable Workers Paid or a paid fallback.

## First commands

```bash
npm install
npm run dev
```

## First review checklist

- Test at 1440×900, 1920×1080, 1024×768, and mobile widths.
- Confirm no desktop icon requires a single click to open.
- Confirm every minimized window can be restored from the Window menu.
- Confirm project details stay on the desktop.
- Confirm keyboard Enter opens a selected icon or project folder.
- Confirm `prefers-reduced-motion` works.
- Confirm the resume PDF loads and downloads.
- Confirm minimizing or closing Contact stops dictation and cancels pending AI work without clearing finalized text or review state.
- Confirm AI is never called until a Tidy message menu option is selected, name/email never enter its request, and only an approved final message reaches Formspree.
- Confirm the original Message draft survives AI failure, rejection, and Undo.

## Recommended next implementation work

1. Add real project screenshots and architecture diagrams inside project detail windows.
2. Add a lightweight browser test suite for desktop selection, double-click opening, window controls, project opening, and resume download.
3. Improve mobile Finder behavior with a bottom sheet for project filters.
4. Add persistent window positions in sessionStorage, but do not persist the intro dismissal forever.
5. Replace brief verse excerpts with approved full text only after confirming publication rights.
6. Add SEO/Open Graph assets and deployment configuration.
7. Audit accessibility with keyboard-only and screen-reader passes.

## Content guardrails

- Never invent deployments, users, clinical validation, partners, awards, metrics, or certification details.
- Preserve the explicit healthcare safety boundaries in `src/data/projects.ts`.
- Keep the pediatric EEG project collaborative in wording.
- For neonatal MRI, never claim guaranteed patient-level separation.
- Treat synthetic utilization figures as synthetic dataset values, not real-world financial results.
- Do not imply employment at AWS; it was a scholar program.
- Keep the message-polisher architecture isolated in `workers/message-polisher/`; do not add browser AI credentials, an Astro server route, or a Vercel AI function.
- Preserve the `AI_POLISH_ENABLED` kill switch, anonymous salted usage counters, exact Durable Object guard, burst limits, and free-plan-only failure behavior.
