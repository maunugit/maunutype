# CLAUDE.md

MaunuType is a personal typing test (timed word tests in English/Finnish plus sourced quote passages). It is a fully client-side React SPA built with Vite and deployed as static files to GitHub Pages at https://maunugit.github.io/maunutype/. There is no backend; all persistence is `localStorage`.

## Commands

```sh
npm run dev        # Vite dev server on http://127.0.0.1:3000 (strictPort, polling watcher)
npm test           # node --experimental-strip-types --test tests/*.test.mjs
npm run typecheck  # tsc --noEmit
npm run lint       # oxlint (type-aware; correctness = error)
npm run format     # oxfmt (single quotes, 80 cols) — not enforced in CI
npm run build      # tsc --noEmit && vite build → dist/
npm start          # vite preview of dist/ on port 3000
```

Run one test file: `node --experimental-strip-types --test tests/typing.test.mjs`. Node ≥ 22.13 is required (type stripping and `--test` globs).

**Deployment:** every push to `main` triggers `.github/workflows/pages.yml` (npm ci → lint → test → build → publish `dist/`). Pushing to `main` updates the live site, so run lint, test and build locally first.

## Architecture

| File | Role |
| --- | --- |
| `lib/typing.ts` | Pure, framework-free scoring engine: `Session` state, `enterCharacter`, `erase`, `tick`, `finish`, `sample`, `metrics`, `comparisonKey`. All functions are immutable (return a new session) and take `now` explicitly. |
| `lib/content.ts` | Word lists (`wordLists`, `makeWords`) and the curated `quotes` collection with provenance metadata; `pickQuote` / `quoteLength`. |
| `lib/storage.ts` | Validated `localStorage` I/O. Keys `maunutype:settings:v1` and `maunutype:results:v1`; history capped at 100, bests stored separately. Malformed data is dropped silently; write failures return `false`. |
| `lib/caret-motion.ts` | Caret glide curve: `caretAt` (position mid-glide), `caretKeyframes` (Web Animations keyframes sampled from the same curve), `CARET_GLIDE_MS`. |
| `components/typing-surface.tsx` | Renders words/letters (`TypingWord`), hidden `<textarea>` for input (handles IME composition, paste/drop blocking, Enter = restart, Esc, Backspace/word-delete), caret placement and line scrolling. |
| `components/speed-chart.tsx` | Hand-rolled SVG chart of cumulative WPM samples and error marks. |
| `app/page.tsx` | `Home`: test lifecycle (`reset`, `type`, `remove`, `commit`, `retry`), the 100 ms timer interval, results view, history/settings sheet, and an optional read-only WebMCP tool (`read_typing_results`). |
| `app/main.tsx` | Entry point; `index.html` loads it. |
| `components/ui/` | The six shadcn/Base UI primitives the app uses: `button`, `select`, `sheet`, `table`, `toggle`, `toggle-group`. |
| `app/globals.css` | All app styling (Tailwind v4 + hand-written CSS, light/`.dark` themes, responsive breakpoints, reduced-motion overrides). |

### Key patterns

- **State mirrored in refs.** `page.tsx` keeps `sessionRef`, `settingsRef`, `quoteRef`, `repeatedRef`, `libraryRef` alongside React state so keystroke handlers and the interval never read stale closures. When changing one of these values, update both the ref and the state.
- **Finishing a test** happens inside `commit()` when a session transitions to `endedAt !== null`; this builds the `Result`, updates bests and history, persists them, and focuses the results view.
- **Words mode** starts with 120 generated words and appends 120 more when the user is within 40 words of the end. The word list re-renders on every keystroke, so keep it short.
- **Timer display** is the `TestClock` component with its own 100 ms interval. The page-level interval only calls `tick()`, so it re-renders `Home` only when a sample is taken or the test ends.
- **Caret:** the active glyph carries `data-caret="true"` (and `data-caret-edge="after"` at a word's end). `TypingSurface` measures that glyph and moves the single `.typing-caret` element (a child of `.typing-content`, so it scrolls with the lines) by setting `style.transform` directly, outside React state. It glides with a Web Animations API animation whose start point is computed from the running glide's `currentTime` (`lib/caret-motion.ts`). Line changes, resizes and reduced motion snap instead. `.typing-content` is shifted with `translateY` so the current line stays on the second visible row.
- **Never animate the caret with a CSS `transition`.** Firefox restarts retargeted transform transitions from a stale position, so the caret snapped back on every keystroke when typing fast (Safari and Chrome were fine). Any caret animation must pass an explicit start position.
- **Personal bests** live in `library.bests`, keyed by `comparisonKey` (separate fresh/repeat keys). Each `Result` stores `bestBefore`, and the results view compares against it: baseline on the first run, otherwise the standing best or "new best / previous". Everything stays in this browser's `localStorage`; there is no account or server.
- **Scoring contract:** the "Scoring contract (v1)" section of `README.md` is the spec (WPM, accuracy, corrections, skipped letters, timing, and personal-best keys). `tests/typing.test.mjs` encodes it. If scoring semantics change, bump the `v1` in `comparisonKey` and the `v1:` filter in `readLibrary` so old bests are not compared against new ones, and update the README.

## Conventions and gotchas

- **Test imports:** tests run in plain Node with type stripping and do not resolve the `@/` alias. Modules that tests import at runtime (`lib/typing.ts`, `lib/caret-motion.ts`) must not have runtime `@/` or extensionless imports. Type-only imports are fine because they are stripped.
- `tests/typing-word.test.mjs` SSR-renders `TypingWord` through a Vite dev server created with `configFile: false`, so the `@/` alias is also missing there. Runtime imports in `components/typing-surface.tsx` must be relative (which is why it imports `../lib/caret-motion`). This test is slower than the rest because it starts Vite.
- **`components/ui/`** is vendored shadcn code (style `base-nova`, see `components.json`) and is excluded from lint but still type-checked. Add a primitive with `npx shadcn add <name>` rather than hand-writing one, and override styles in `globals.css` instead of editing the vendored files. The `shadcn` package must stay installed because `globals.css` imports `shadcn/tailwind.css`.
- **Plain Vite SPA:** the repo began as a Next/vinext + Cloudflare template, and that tooling has been removed. Do not add `'use client'`, Next.js, RSC or Cloudflare config back. CSS-import types come from `vite/client` in `tsconfig.json`. Tailwind scans every source file, so unused components inflate the CSS bundle.
- `vite.config.ts` sets `base: './'` so assets resolve under the `/maunutype/` Pages subpath. Do not change it to an absolute base.
- Lint enables `react/react-compiler`. Where a rule is deliberately violated, the code uses an inline `// oxlint-disable-next-line <rule> -- reason` comment; follow that style.
- Code style: dense, comment-light TypeScript, single quotes, and `@/` imports in app code. Match the surrounding code.
- `timing` uses `performance.now()` throughout. Pass explicit `now` values in tests rather than mocking clocks.
