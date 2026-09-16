# Security dependency maintenance — 2026-09-16

Branch: `chore/security-dependency-updates`. Baseline: `5d8a71516a1114b4fc301c41ea4de51d67b30d1c`.

**Preview-only maintenance. No production merge or Worker deployment is authorized or performed.**

## Audit counts

npm counts affected package records (including parent meta-vulnerabilities), not individual GHSAs. GitHub counts individual advisory/package/manifest records.

| Dependency tree | Before (critical / high / moderate / low) | After |
| --- | --- | --- |
| root-production | 9 (1 / 6 / 2 / 0) | 0 |
| root-all | 10 (1 / 7 / 2 / 0) | 0 |
| worker-production | 0 (0 / 0 / 0 / 0) | 0 |
| worker-all | 8 (0 / 5 / 3 / 0) | 0 |

## Package inventory, dependency chains, and reachability

Production/dev labels below are npm dependency classifications, not a claim that these Node tools run in visitors’ browsers. All browser JS/CSS bundles remain byte-identical. Each inventory row maps to its exact advisory rows below.

| Tree / package | Installed → selected | Change | Direct / transitive; npm scope | Dependency chain | Portfolio-specific exposure / action |
| --- | --- | --- | --- | --- | --- |
| root / astro | 7.0.7 → 7.2.8 | minor | direct; production | root → Astro | Build framework only here; no untrusted AVIF optimization, runtime image endpoint, server auth/base stripping, or View Transition animation input. **Patched.** |
| root / baseline-browser-mapping | 2.10.43 → 2.11.0 | minor | transitive; production | @astrojs/react → @vitejs/plugin-react → Babel → browserslist → baseline-browser-mapping | Compiler target metadata from trusted build configuration; no visitor-supplied target queries. **Patched.** |
| root / browserslist | 4.28.6 → 4.28.7 | patch | transitive; production | @astrojs/react → @vitejs/plugin-react → Babel → browserslist | Build-time Babel target resolution; no visitor queries or uploaded custom statistics. **Patched.** |
| root / fast-uri | 3.1.3 → 3.1.6 | patch | transitive; dev-only | @astrojs/check → language-server → volar-service-yaml → yaml-language-server → AJV → fast-uri | Development YAML language-server validation only; not a production URL/security gate. **Patched.** |
| root / js-yaml | 4.3.0 → 4.3.2 | patch | transitive; production | Astro / @astrojs/internal-helpers → js-yaml | Build/frontmatter parser; no untrusted YAML ingestion by the site. **Patched.** |
| root / nanoid | 3.3.16 → 3.3.18 | patch | transitive; production | Astro / @astrojs/react → Vite → PostCSS → nanoid | Build CSS tooling; no visitor-controlled size/custom generator call. **Patched.** |
| root / postcss | 8.5.18 → 8.5.23 | patch | transitive; production | Astro / @astrojs/react → Vite → PostCSS | Build CSS from repository inputs; no visitor sourceMappingURL input or runtime CSS processor. **Patched.** |
| root / sharp | 0.35.3 → 0.35.4 | patch | transitive; production | Astro → Sharp (optional) | No processing of visitor images. Build tooling can decode images, but this app uses plain static public assets, no AVIF and no Astro image-service calls. **Patched.** |
| root / smol-toml | 1.7.0 → 1.7.1 | patch | transitive; production | Astro / @astrojs/internal-helpers → smol-toml | Build/frontmatter parser; no visitor-controlled TOML input. **Patched.** |
| root / svgo | 4.0.2 → 4.1.0 | minor | transitive; production | Astro → SVGO | Build SVG tooling; not a sanitizer for uploaded/user-controlled SVG in this site. **Patched.** |
| worker / @vitest/mocker | 4.1.10 → 4.1.11 | patch | transitive; dev-only | Worker → Vitest → @vitest/mocker | Local test mocking only; no exposed redirect-mock endpoint. **Patched.** |
| worker / miniflare | 4.20260710.0 → 4.20260722.0 | minor | transitive; dev-only | Worker → Wrangler → Miniflare | Local Worker emulator only; no deployed emulator/image binding. **Patched.** |
| worker / nanoid | 3.3.16 → 3.3.18 | patch | transitive; dev-only | Worker → Vitest → Vite → PostCSS → nanoid | Build CSS tooling; no visitor-controlled size/custom generator call. **Patched.** |
| worker / postcss | 8.5.19 → 8.5.23 | patch | transitive; dev-only | Worker → Vitest → Vite → PostCSS | Build CSS from repository inputs; no visitor sourceMappingURL input or runtime CSS processor. **Patched.** |
| worker / sharp | 0.34.5 → 0.35.4 | minor (0.x; parent-supported) | transitive; dev-only | Worker → Wrangler → Miniflare → sharp | Local emulator tooling only; absent from deployed Worker. No image binding/upload/remote-image processing route. Parent first moves to supported 0.35.x, then security patch override 0.35.4. **Patched.** |
| worker / undici | 7.28.0 → 7.29.0 | minor | transitive; dev-only | Worker → Wrangler → Miniflare → undici | Local emulator tooling only; absent from deployed Worker. No image binding/upload/remote-image processing route. Same-major 7.29.0 security override; tests/typecheck/dry-run pass. **Patched.** |
| worker / vitest | 4.1.10 → 4.1.11 | patch | direct; dev-only | Worker → Vitest | Local test runner; no exposed Vitest browser/mock server in production. **Patched.** |
| worker / wrangler | 4.111.0 → 4.114.0 | minor | direct; dev-only | Worker → Wrangler | Local CLI/dry-run only; not included in deployed Worker code. **Patched.** |

## Every advisory identified by npm

Wrangler and Miniflare also receive propagated high meta-vulnerability records via Sharp/undici; those parent records have no additional GHSA of their own. Fixed minima below are advisory-specific; the chosen version clears every listed advisory for the package.

| Tree / package | Severity | Advisory / CVE | Vulnerable range | First patched version for this advisory | Selected version / action |
| --- | --- | --- | --- | --- | --- |
| root / astro | moderate | [GHSA-4g3v-8h47-v7g6](https://github.com/advisories/GHSA-4g3v-8h47-v7g6)<br>CVE-2026-73422 | `>=2.9.0 <=7.0.9` | 7.1.0 | 7.2.8 — resolved |
| root / astro | critical | [GHSA-26w7-cxv4-gfx2](https://github.com/advisories/GHSA-26w7-cxv4-gfx2) | `<7.2.8` | 7.2.8 | 7.2.8 — resolved |
| root / astro | moderate | [GHSA-376h-93r7-7g6f](https://github.com/advisories/GHSA-376h-93r7-7g6f)<br>CVE-2026-84376 | `<=7.2.3` | 7.2.4 | 7.2.8 — resolved |
| root / baseline-browser-mapping | moderate | [GHSA-w5vr-8v7q-w6rv](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv)<br>CVE-2026-45819 | `>=2.0.0 <2.11.0` | 2.11.0 | 2.11.0 — resolved |
| root / browserslist | high | [GHSA-c83g-rgw3-j3cx](https://github.com/advisories/GHSA-c83g-rgw3-j3cx)<br>CVE-2026-73089 | `<=4.28.6` | 4.28.7 | 4.28.7 — resolved |
| root / browserslist | high | [GHSA-73wf-gq98-2v4g](https://github.com/advisories/GHSA-73wf-gq98-2v4g)<br>CVE-2026-73088 | `<=4.28.6` | 4.28.7 | 4.28.7 — resolved |
| root / fast-uri | high | [GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx)<br>CVE-2026-16221 | `>=3.0.0 <=3.1.3` | 3.1.4 | 3.1.6 — resolved |
| root / fast-uri | high | [GHSA-7p8r-x3mc-p8w7](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7)<br>CVE-2026-18446 | `>=3.0.0 <3.1.5` | 3.1.5 | 3.1.6 — resolved |
| root / fast-uri | high | [GHSA-5jgf-p345-68v8](https://github.com/advisories/GHSA-5jgf-p345-68v8)<br>CVE-2026-75931 | `>=3.1.3 <3.1.6` | 3.1.6 | 3.1.6 — resolved |
| root / fast-uri | high | [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc)<br>CVE-2026-75975 | `>=3.0.0 <3.1.6` | 3.1.6 | 3.1.6 — resolved |
| root / fast-uri | high | [GHSA-fph4-wmhf-6fwf](https://github.com/advisories/GHSA-fph4-wmhf-6fwf)<br>CVE-2026-75899 | `>=3.1.2 <3.1.6` | 3.1.6 | 3.1.6 — resolved |
| root / fast-uri | high | [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp)<br>CVE-2026-76172 | `>=3.0.0 <3.1.6` | 3.1.6 | 3.1.6 — resolved |
| root / js-yaml | high | [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) | `>=4.0.0 <4.3.1` | 4.3.1 | 4.3.2 — resolved |
| root / js-yaml | high | [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh)<br>CVE-2026-84375 | `>=4.0.0 <4.3.2` | 4.3.2 | 4.3.2 — resolved |
| root / nanoid | high | [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8)<br>CVE-2026-67213 | `<3.3.18` | 3.3.18 | 3.3.18 — resolved |
| root / postcss | moderate | [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp)<br>CVE-2026-69153 | `<=8.5.22` | 8.5.23 | 8.5.23 — resolved |
| root / sharp | high | [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) | `<0.35.4` | 0.35.4 | 0.35.4 — resolved |
| root / smol-toml | high | [GHSA-7w5x-hrqm-74c2](https://github.com/advisories/GHSA-7w5x-hrqm-74c2)<br>CVE-2026-85730 | `<=1.7.0` | 1.7.1 | 1.7.1 — resolved |
| root / svgo | high | [GHSA-w27v-7q3p-w38r](https://github.com/advisories/GHSA-w27v-7q3p-w38r)<br>CVE-2026-84370 | `>=4.0.0 <4.1.0` | 4.1.0 | 4.1.0 — resolved |
| root / svgo | moderate | [GHSA-4vpr-x523-8j87](https://github.com/advisories/GHSA-4vpr-x523-8j87)<br>CVE-2026-84369 | `>=4.0.0 <4.1.0` | 4.1.0 | 4.1.0 — resolved |
| worker / @vitest/mocker | moderate | [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9)<br>CVE-2026-84373 | `>=2.1.0 <4.1.11` | 4.1.11 | 4.1.11 — resolved |
| worker / nanoid | high | [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8)<br>CVE-2026-67213 | `<3.3.18` | 3.3.18 | 3.3.18 — resolved |
| worker / postcss | moderate | [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp)<br>CVE-2026-69153 | `<=8.5.22` | 8.5.23 | 8.5.23 — resolved |
| worker / sharp | high | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) | `<0.35.0` | 0.35.0 | 0.35.4 — resolved |
| worker / sharp | high | [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) | `<0.35.4` | 0.35.4 | 0.35.4 — resolved |
| worker / undici | moderate | [GHSA-8xcm-r25x-g524](https://github.com/advisories/GHSA-8xcm-r25x-g524)<br>CVE-2026-16728 | `>=7.0.0 <7.29.0` | 7.29.0 | 7.29.0 — resolved |
| worker / undici | high | [GHSA-4cwx-7wf7-3272](https://github.com/advisories/GHSA-4cwx-7wf7-3272)<br>CVE-2026-13697 | `>=7.0.0 <7.29.0` | 7.29.0 | 7.29.0 — resolved |
| worker / undici | moderate | [GHSA-m8rv-5g2x-5cg5](https://github.com/advisories/GHSA-m8rv-5g2x-5cg5)<br>CVE-2026-15157 | `>=7.0.0 <7.29.0` | 7.29.0 | 7.29.0 — resolved |
| worker / undici | moderate | [GHSA-jr45-8vmc-qm54](https://github.com/advisories/GHSA-jr45-8vmc-qm54)<br>CVE-2026-14643 | `>=7.0.0 <7.29.0` | 7.29.0 | 7.29.0 — resolved |
| worker / undici | moderate | [GHSA-v3r7-h72x-cjcm](https://github.com/advisories/GHSA-v3r7-h72x-cjcm)<br>CVE-2026-16729 | `>=7.0.0 <7.29.0` | 7.29.0 | 7.29.0 — resolved |
| worker / vitest | moderate | [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9)<br>CVE-2026-84373 | `>=2.1.0 <4.1.11` | 4.1.11 | 4.1.11 — resolved |

## GitHub cross-check

GitHub had **30 open advisory records** on unchanged master. All 30 map to the two npm audits, and every installed branch version is outside its GitHub vulnerable range. GitHub-only findings: **0**. These alerts are fixed in this branch, **not closed on production/master yet**.

Resolved on this branch: #1, #2, #3, #4, #5, #6, #7, #8, #9, #10, #11, #12, #13, #15, #16, #17, #18, #19, #20, #21, #22, #23, #24, #25, #26, #27, #28, #29, #30, #31.

npm additionally reports the Worker nanoid advisory (also present in the root tree) and propagated parent meta-vulnerabilities. This explains why package totals and GitHub totals differ.

## Astro / Sharp / AVIF re-evaluation

- Before: Astro 7.0.7 owned optional Sharp 0.35.3. After: Astro 7.2.8 requires Sharp ^0.35.4; the lockfile selects 0.35.4.
- [Astro GHSA-26w7-cxv4-gfx2](https://github.com/withastro/astro/security/advisories/GHSA-26w7-cxv4-gfx2) fixes malicious AVIF optimization in 7.2.8. [Sharp GHSA-rgj7-g3m4-5g8c](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c) fixes upstream libheif processing in 0.35.4.
- `astro.config.mjs` remains `output: static`, with no server adapter. Only five static content routes exist. No API/image route or server image transformation endpoint is introduced.
- Components use plain `<img>` URLs into `public/`; no `astro:assets` Image/Picture/getImage calls, remote image processing configuration, uploaded files, AVIF inputs, or visitor-supplied image URLs were found.
- Build time: Sharp is installed as Astro tooling, but this build performs no application image transforms. Trusted checked-in assets are copied unchanged. A future untrusted image-processing feature would require new threat review; static output alone would not protect an unsafe build input.
- Runtime/server: visitors cannot invoke Sharp. The separately deployed message-polisher Worker accepts validated JSON text for `/polish`, with `/health` and authenticated usage reporting; it has no image upload/URL/transform route and imports no Sharp/Astro. No real AI calls or messages were made during testing.

## Controlled patch strategy and compatibility

- Astro stays on major 7; 7.2.8 is the first version fixing the AVIF advisory. React, React DOM, TypeScript, source code, styles, content, assets, tests, and deployment configuration are unchanged.
- Exact security overrides select the lowest versions clearing all current findings, preventing unrelated latest-version drift. No `npm audit fix`, `--force`, or major framework migration was used.
- Astro/SVGO require some new internal majors (cookie, diff, magic-string, neotraverse, css-select/css-what) and native compiler/image package updates. These were reviewed as parent-owned changes, not independently adopted application APIs; browser bundles remain identical.
- Worker: Vitest 4.1.11 patches its mocker. Wrangler 4.114.0 moves its parent-owned Miniflare tooling to Sharp 0.35.x; Sharp 0.35.4 and undici 7.29.0 are bounded overrides. This avoids moving to later Wrangler releases that adopt Miniflare 5 alpha.
- Wrangler requires workers-types ^5.20260722.1, so the smallest matching types release is selected. Miniflare/workerd move together to the parent-required July 22 versions.
- npm 10.9.8 initially failed while exploring new optional Vite/Vitest peer packages. Pinning the already-installed Worker Vite 8.1.5 avoids that unrelated upgrade; a normal clean `npm ci` then passed without legacy-peer or force flags.
- The package-lock diffs include platform-specific native binary variants and limited refreshed transitive metadata; both trees passed clean reinstall and audits. Revisit/remove overrides when upstream requirements enforce these fixes; do not leave security pins unreviewed during future upgrades.

## Validation and regression evidence

- Node 22.23.1, npm 10.9.8; clean `npm ci` in root and Worker.
- `npm run check`: 47 files, 0 errors/warnings/hints. `npm run build`: passed, five static routes.
- Full root Node suite: **49 passed**. Worker: **44 passed** across five test files, TypeScript passed, Wrangler deployment **dry-run** passed. No tests modified or weakened.
- Phone 390×844: Home grid/Resume/Search/dock, immersive Page 2 and horizontal round-trip, all seven Projects and ASSERA detail, About, Experience, Resume, Field Notes list/Week 03/direct-route refresh, Contact validation/email fallback, safe GitHub/LinkedIn links passed.
- Desktop 1440×900: Home, Projects, About/photos, Experience, Resume/PDF, Contact, Field Notes and Definitely Important opening/closing passed. Tablet 768×1024: existing scaffold app/Home navigation passed.
- Rickroll lifecycle regression tests pass; the same inline iframe/configuration mounts on phone, Home removes focus exposure and retains its prepared instance, and desktop Close removes its iframe. Embedded YouTube playback was not established in this local automated browser (connection remained pending); no claim of fresh physical playback approval. The four browser bundles, including the approved player implementation, are byte-identical to baseline.
- All 50 static image/icon/PDF URLs returned successful local responses with exact source bytes; every `public/` file matches built output. Visible icons, verse artwork, real photos and Resume preview rendered. No application console errors were observed.
- Total build: **31,184,102 → 31,183,987 bytes** (−115 bytes), 59 files both times. All four JS/CSS bundle names, bytes and gzip sizes are identical. No new visitor-side runtime dependency or server output.
- `git diff --check`: passed. Production remains at the baseline commit until a separately approved merge.

## Remaining advisories and next step

**None in either npm audit (production or all dependencies).** All 30 GitHub baseline records are addressed in the branch; master alerts remain open pending approval/merge. Review the security PR and Vercel Preview before authorizing production.
