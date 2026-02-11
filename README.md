# Glyph

A browser-based ASCII art converter for images and video. Drop in a file, tweak the settings, and export as text, ANSI, HTML, PNG, GIF, or WebM — all client-side, no backend required.

## Features

- **Multiple rendering modes** — luminance mapping, Sobel edge detection, Floyd-Steinberg dithering
- **7 character set presets** — Classic, Extended, Blocks, Braille (2x4 sub-pixel encoding), Minimal, Alphanumeric, or define your own
- **Color modes** — monochrome, foreground color, full color (fg + bg)
- **Video support** — frame-by-frame extraction with play/pause, seek, and frame stepping
- **Export formats** — TXT, ANSI (8/16/256/truecolor), HTML, PNG, GIF, WebM, ZIP frame sequence
- **Real-time preview** — all settings update live with 150ms debounce
- **Web Worker rendering** — pixel processing runs off the main thread with automatic fallback
- **Light/dark/system theme** — follows system preference by default
- **Fit-to-container scaling** — preview automatically scales to fill the available space at any output resolution

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and drop an image or video onto the canvas.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run unit tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Bundler | Vite 7 |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| UI Primitives | Radix UI (accordion, slider, switch, select) |
| Icons | Lucide React |
| GIF Encoding | modern-gif |
| ZIP Generation | fflate |
| Video Recording | MediaRecorder API |
| Testing | Vitest + jsdom |

## Project Structure

```
src/
├── app/
│   ├── App.tsx                     # Root component
│   ├── layout/                     # Header, Sidebar, Canvas, Footer
│   └── theme/                      # ThemeProvider (light/dark/system)
├── features/
│   ├── input/                      # DragDrop, URLInput, ClipboardHandler
│   ├── settings/
│   │   ├── components/             # RenderSettings, ResolutionControls, CharsetPicker, ColorControls
│   │   ├── store.ts                # Zustand store (all app state)
│   │   └── presets.ts              # Character set presets
│   ├── renderer/
│   │   ├── engine/                 # Sampler, luminance, edge-detect, dither, braille, mapper
│   │   ├── worker/                 # Web Worker pipeline + message protocol
│   │   └── hooks/                  # useRenderer, useVideoFrames
│   ├── preview/                    # TextPreview, CanvasPreview, VideoTransport
│   └── export/
│       ├── formatters/             # plaintext, ansi, html, png, gif, webm, frames
│       └── components/             # ExportBar, FormatOptions
└── shared/
    ├── types/                      # TypeScript interfaces
    ├── utils/                      # cn, color math, debounce
    └── ui/                         # Toast notifications
```

## Architecture

The rendering pipeline is decoupled from the UI:

1. Source media is drawn to an offscreen canvas to extract `ImageData`
2. Pixel data is transferred to a Web Worker via `Transferable` (zero-copy)
3. The worker runs the pipeline: **sample grid** → **apply mode** (luminance/edge/dither/braille) → **map to characters**
4. The worker posts back a `CharacterGrid` (2D array of `{ char, fg?, bg? }`)
5. The preview component renders the grid as `<pre>` (mono) or `<canvas>` (color)

The engine modules (`src/features/renderer/engine/`) are pure functions with no DOM or React dependencies, making them testable in isolation and extractable as a standalone library.

## Rendering Modes

| Mode | Description |
|------|-------------|
| **Luminance** | Maps pixel brightness to character density |
| **Edge Detection** | Sobel filter with directional edge characters (`\|`, `-`, `/`, `\`) |
| **Dithering** | Floyd-Steinberg error diffusion for improved detail at low resolutions |
| **Braille** | 2x4 sub-pixel dot encoding using Unicode braille (U+2800-U+28FF) |

Edge detection and dithering are mutually exclusive. All modes support invert.

## Input Methods

- **Drag and drop** — images (PNG, JPEG, GIF, WebP, BMP) and video (MP4, WebM, OGG)
- **Click to browse** — file picker when no source is loaded
- **URL fetch** — paste a direct image URL and click Fetch
- **Clipboard paste** — Ctrl/Cmd+V for screenshots or image data

## Export Formats

| Format | Supports Color | Copy to Clipboard |
|--------|---------------|------------------|
| TXT | No | Yes |
| ANSI | Yes (8/16/256/truecolor) | Yes |
| HTML | Yes (inline CSS) | Yes |
| PNG | Yes (canvas render) | No |
| GIF | Yes (video only) | No |
| WebM | Yes (video only) | No |
| ZIP Frames | Configurable | No |

## Testing

67 unit tests cover the core rendering algorithms:

```bash
npm test
```

Tests are in `src/features/renderer/engine/__tests__/` covering sampler, luminance, edge detection, dithering, braille encoding, and the character mapper.

## Browser Support

Requires a modern browser with Web Worker and Canvas API support:

- Chrome 90+
- Firefox 105+
- Safari 16.4+
- Edge 90+

## License

TBD
