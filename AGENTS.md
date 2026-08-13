# Contributor guide

- Use Node.js 22.12.0 or newer and install dependencies with `npm ci`.
- Preserve the same-page macOS interaction model, accessibility, and responsive behavior.
- Keep credentials out of source control and keep external integrations server-side where appropriate.
- Before handing off changes, run `npm run check`, `npm run build`, and the relevant Worker tests.
