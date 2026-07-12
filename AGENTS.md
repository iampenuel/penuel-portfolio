# AGENTS.md

## Project identity

This repository is Penuel Stanley-Zebulon's interactive Mac-style portfolio.

## Engineering priorities

- Preserve same-page desktop interactions.
- Keep the experience fast, accessible, responsive, and keyboard usable.
- Prefer small typed React components and data-driven content.
- Avoid unnecessary dependencies.
- Never introduce audio unless Penuel explicitly changes the silent-mode decision.
- Do not add a dock.
- Do not replace double-click opening with single-click opening.

## Validation before handing work back

Run:

```bash
npm run check
npm run build
```

Manually verify the core flows listed in `CODEX_START_HERE.md`.
