# CLAUDE.md

## Project

Glyph is a browser-based ASCII art converter for images and video. Fully client-side, no backend. See `ascii-art-converter-spec.md` for the full product specification.

## Commands

```bash
npm run dev          # Start dev server (Vite, HMR)
npm run build        # tsc + vite build → dist/
npm test             # vitest run (67 tests)
npm run test:watch   # vitest watch mode
npm run lint         # eslint
```

Always run `npx tsc --noEmit` and `npm test` before considering work complete.

## Tech Stack

- React 19 + TypeScript (strict mode, noUnusedLocals, noUnusedParameters)
- Vite 7 with `@tailwindcss/vite` plugin
- Tailwind CSS 4 (v4 uses `@import "tailwindcss"` in CSS, not a config file)
- Zustand for state management
- Radix UI primitives (accordion, slider, switch, select)
- Vitest + jsdom for testing

## Path Aliases

`@/` maps to `src/` — configured in both `vite.config.ts` and `tsconfig.app.json`.

**Critical**: Worker files (`src/features/renderer/worker/`) must use **relative imports**, not `@/` aliases. Vite workers don't resolve TypeScript path aliases.

## Architecture

### Rendering Pipeline

```
Source → extractImageData() → Web Worker → sampler → mapper → CharacterGrid → Preview
```

- **Engine** (`src/features/renderer/engine/`): Pure functions — sampler, luminance, edge-detect, dither, braille, mapper. No DOM dependencies. All have unit tests.
- **Worker** (`src/features/renderer/worker/`): `render.worker.ts` receives `ArrayBuffer` via `Transferable`, runs the engine pipeline, posts back `CharacterGrid`.
- **Hooks** (`src/features/renderer/hooks/`): `useRenderer` manages worker lifecycle, dispatches renders on state changes (debounced), falls back to main thread after 3 worker crashes.

### State

Single Zustand store at `src/features/settings/store.ts`. Contains source media refs, settings, render result, video playback state, theme, and toast queue. Access outside React via `useAppStore.getState()`.

### Rendering Modes

Controlled by boolean flags (`enableLuminance`, `enableEdge`, `enableDithering`), not an enum. Edge and dithering are mutually exclusive — enforced in the store's `updateSettings`.

### Preview

- **TextPreview**: Used for mono mode. Renders `<pre>` with CSS `transform: scale()` to fit container.
- **CanvasPreview**: Used for foreground/full color modes. Renders to `<canvas>` with per-character coloring.
- Both use `usePreviewScale` hook with `ResizeObserver` for fit-to-container scaling.

### Export

Formatters are in `src/features/export/formatters/`. PNG, GIF, WebM, and frames are lazy-imported (`await import(...)`) to keep the initial bundle small.

## Key Patterns

- Presets defined in `src/features/settings/presets.ts` — `getActiveCharset()` resolves preset name to character string
- Braille uses sub-pixel dot encoding (2x4 grid per character, U+2800-U+28FF) — separate code path in the mapper
- `CharacterGrid` is `CharacterCell[][]` where each cell has `{ char, fg?, bg? }`
- Color quantization options: 8, 16, 256, or truecolor

## Testing

Tests live in `src/features/renderer/engine/__tests__/`. They test the pure engine functions only (no DOM, no React). Test files are excluded from `tsconfig.app.json` — vitest runs them separately with its own config (`vitest.config.ts` with `globals: true` and jsdom environment).

## Gotchas

- `useRef` needs explicit initial value (`useRef<T>(undefined)`) with TypeScript strict mode
- Worker files: relative imports only, no `@/` alias
- Test files excluded from `tsconfig.app.json` to avoid vitest global type conflicts with `tsc`
- Tailwind CSS 4 uses CSS-based config (`@theme` blocks in `src/index.css`), not `tailwind.config.js`
