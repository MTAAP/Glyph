# Glyph — Product Specification
### ASCII Art Converter for Images & Video

**Version:** 1.0  
**Date:** February 11, 2026  
**Status:** Draft

---

## 1. Overview

**Glyph** is a browser-based tool that converts images and video into ASCII art with real-time preview, configurable resolution, character sets, and multiple output formats optimized for both CLI and web consumption.

The application runs entirely client-side — no backend required. All processing happens in the browser using Canvas API and Web Workers, with an architecture that supports future WebAssembly optimization for the pixel-processing pipeline.

---

## 2. Goals & Non-Goals

### Goals

- Convert still images and video to ASCII art in the browser
- Provide real-time live preview as the user adjusts settings
- Support multiple rendering modes: luminance mapping, edge detection, dithering
- Output in formats usable by CLI tools (plain text, ANSI), web apps (HTML, PNG), and for sharing (GIF, WebM)
- Keep the core rendering engine decoupled from the UI for potential extraction as a standalone library
- Deliver a polished, responsive UI that works on desktop browsers

### Non-Goals

- Server-side processing or API endpoints (fully client-side)
- Mobile-first design (desktop-optimized, mobile-responsive as a secondary concern)
- Audio processing from video sources
- Real-time webcam input (may be added later; excluded from v1)
- MP4 export (requires server-side encoding; WebM is the client-side equivalent)

---

## 3. User Personas

| Persona | Use Case |
|---------|----------|
| **CLI Developer** | Wants plain text or ANSI output to pipe into terminal tools, embed in READMEs, or display in terminal dashboards |
| **Web Developer** | Wants HTML output to embed in websites, or PNG/GIF for social sharing |
| **Creative / Artist** | Experiments with character sets, color modes, and rendering algorithms for aesthetic output |
| **Casual User** | Drops in an image, tweaks a slider, copies the result |

---

## 4. Input Sources

### 4.1 File Upload (Drag & Drop)

- Drag and drop zone covering the main canvas area
- Click-to-browse fallback
- Supported image formats: JPEG, PNG, GIF (first frame), WebP, BMP, SVG (rasterized)
- Supported video formats: MP4, WebM, MOV (browser-dependent via `<video>` element codec support)
- Maximum file size: 200 MB (soft limit with warning; constrained by browser memory)

### 4.2 URL Input

- Text field accepting direct image/video URLs
- Fetched client-side via `fetch()` — subject to CORS restrictions
- Show clear error messaging when CORS blocks a resource, with suggestion to download and re-upload
- Support for common image hosts (Imgur, Unsplash direct links, etc.)

### 4.3 Clipboard Paste

- Global `paste` event listener
- Supports pasted images (e.g., screenshots via Cmd/Ctrl+V)
- Supports pasted URLs (auto-detected and fetched)

---

## 5. Rendering Engine

### 5.1 Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Input       │────▶│  Pixel Sampler    │────▶│  Character      │
│  (Canvas)    │     │  (Web Worker)     │     │  Mapper         │
│              │     │                   │     │  (Web Worker)   │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  Output          │
                                              │  Formatter       │
                                              └─────────────────┘
```

- **Input Stage:** Source media is drawn to an offscreen `<canvas>` element. For video, frames are extracted at the target framerate using `requestVideoFrameCallback()` or `requestAnimationFrame()` fallback.
- **Pixel Sampler:** Divides the canvas into a grid based on the configured output resolution. Each cell is sampled to produce a representative color/luminance value. Runs in a Web Worker to avoid blocking the UI thread.
- **Character Mapper:** Maps sampled values to characters based on the active rendering mode and character set. Also runs in the Web Worker.
- **Output Formatter:** Converts the character grid into the requested output format (plain text, ANSI, HTML, PNG, etc.). Runs on the main thread for formats requiring DOM/Canvas access.

### 5.2 WASM Upgrade Path

The Pixel Sampler and Character Mapper are the performance-critical hot path. The Web Worker interface should accept and return `ArrayBuffer`/`SharedArrayBuffer` data, making it straightforward to swap the JS implementation for a Rust-compiled WASM module behind the same message interface. This is not required for v1 but the architecture must not preclude it.

### 5.3 Rendering Modes

#### 5.3.1 Luminance Mapping (Default)

Each grid cell is reduced to a single luminance value (0–255) using the standard formula:

```
L = 0.299 * R + 0.587 * G + 0.114 * B
```

The luminance value is then mapped to a character from the active character set, where the character's position in the ramp corresponds to its visual density.

#### 5.3.2 Edge Detection

Applies a Sobel filter (or configurable kernel) to detect edges before character mapping. Edge pixels are mapped to directional characters where possible (e.g., `|`, `-`, `/`, `\`, `+`), while non-edge areas use the standard luminance ramp or are left as spaces.

**Settings:**
- Edge threshold: slider (0–255, default 128)
- Edge character set: separate from the fill character set
- Fill mode: luminance ramp, single character, or empty (edges only)

#### 5.3.3 Dithering

Applies Floyd-Steinberg error diffusion dithering to the luminance values before character mapping. This redistributes quantization error to neighboring cells, improving perceived detail at low resolutions.

**Settings:**
- Dithering strength: slider (0–100%, default 100%)
- Can be combined with luminance mapping (not with edge detection)

#### 5.3.4 Mode Combinations

| Luminance | Edge Detection | Dithering | Result |
|-----------|---------------|-----------|--------|
| ✅ | ❌ | ❌ | Standard ASCII art |
| ✅ | ❌ | ✅ | Dithered ASCII art (better detail) |
| ❌ | ✅ | ❌ | Edge-only outline art |
| ✅ | ✅ | ❌ | Edges overlaid on luminance fill |

---

## 6. Configuration & Controls

### 6.1 Resolution

| Control | Type | Range | Default | Description |
|---------|------|-------|---------|-------------|
| Output Width | Slider + number input | 20–300 columns | 80 | Number of characters per row |
| Aspect Ratio Correction | Toggle + ratio input | 0.3–1.0 | 0.5 | Compensates for terminal characters being taller than wide. A value of 0.5 means each character cell is twice as tall as it is wide. |
| Lock Aspect Ratio | Toggle | on/off | on | Maintains source image proportions |

**Output height** is calculated automatically:

```
outputHeight = (sourceHeight / sourceWidth) * outputWidth * aspectRatioCorrection
```

### 6.2 Character Sets

#### Presets

| Name | Characters | Best For |
|------|-----------|----------|
| Classic | ` .:-=+*#%@` | General purpose, high compatibility |
| Extended | ` .',:;!~-_+<>i!lI?/\|()1{}[]rcvunxzjftLCJUOQoc#MW&8%B@$` | Fine detail |
| Blocks | ` ░▒▓█` | Bold, graphic look |
| Braille | `⠀⠁⠂⠃⠄⠅⠆⠇⡀⡁⡂⡃⡄⡅⡆⡇⠈⠉⠊⠋⠌⠍⠎⠏⡈⡉⡊⡋⡌⡍⡎⡏⠐⠑⠒⠓⠔⠕⠖⠗⡐⡑⡒⡓⡔⡕⡖⡗⠘⠙⠚⠛⠜⠝⠞⠟⡘⡙⡚⡛⡜⡝⡞⡟⠠⠡⠢⠣⠤⠥⠦⠧⡠⡡⡢⡣⡤⡥⡦⡧⠨⠩⠪⠫⠬⠭⠮⠯⡨⡩⡪⡫⡬⡭⡮⡯⠰⠱⠲⠳⠴⠵⠶⠷⡰⡱⡲⡳⡴⡵⡶⡷⠸⠹⠺⠻⠼⠽⠾⠿⡸⡹⡺⡻⡼⡽⡾⡿⢀⢁⢂⢃⢄⢅⢆⢇⣀⣁⣂⣃⣄⣅⣆⣇⢈⢉⢊⢋⢌⢍⢎⢏⣈⣉⣊⣋⣌⣍⣎⣏⢐⢑⢒⢓⢔⢕⢖⢗⣐⣑⣒⣓⣔⣕⣖⣗⢘⢙⢚⢛⢜⢝⢞⢟⣘⣙⣚⣛⣜⣝⣞⣟⢠⢡⢢⢣⢤⢥⢦⢧⣠⣡⣢⣣⣤⣥⣦⣧⢨⢩⢪⢫⢬⢭⢮⢯⣨⣩⣪⣫⣬⣭⣮⣯⢰⢱⢲⢳⢴⢵⢶⢷⣰⣱⣲⣳⣴⣵⣶⣷⢸⢹⢺⢻⢼⢽⢾⢿⣸⣹⣺⣻⣼⣽⣾⣿` | Ultra-high resolution (each braille char = 2×4 dot grid) |
| Minimal | ` .#` | High contrast, simple |
| Alphanumeric | ` .oO0@#` | Readable, familiar |

#### Custom Character Set

- Free-text input field where the user types characters ordered from lightest (leftmost) to darkest (rightmost)
- Minimum 2 characters required
- Duplicate characters are silently deduplicated
- A visual density preview strip shows the ramp as entered

#### Invert Toggle

Reverses the character ramp so light areas map to dense characters and dark areas map to sparse characters. Useful for dark-on-light vs. light-on-dark output contexts.

### 6.3 Color Mode

| Mode | Description | Output Support |
|------|-------------|---------------|
| **Monochrome** | Pure luminance-to-character mapping. Output is single-color text. | All formats |
| **Foreground Color** | Each character is colored using the sampled pixel's RGB value. Background is transparent/default. | ANSI, HTML, PNG |
| **Full Color** | Both foreground and background color per character. Background uses the sampled color; foreground uses a contrasting shade for readability. | ANSI (256/truecolor), HTML, PNG |

**Color quantization option:** Reduce color palette to N colors (8, 16, 256, or full 24-bit) for ANSI compatibility or aesthetic effect.

### 6.4 Video-Specific Controls

| Control | Type | Range | Default | Description |
|---------|------|-------|---------|-------------|
| Target FPS | Slider | 1–30 | 10 | Frame extraction rate for ASCII conversion |
| Playback Speed | Slider | 0.25x–4x | 1x | Playback speed in preview |
| Frame Range | Dual slider | start–end | full duration | Select a sub-range of the video to convert |
| Loop Playback | Toggle | on/off | on | Loop the ASCII preview |

---

## 7. Output Formats

### 7.1 Still Image Outputs

#### Plain Text (.txt)

- Raw character grid with newline separators
- No color information
- Includes optional header comment with generation metadata:
  ```
  # Generated by Glyph (https://glyph.yourdomain.com)
  # Source: photo.jpg (1920x1080)
  # Resolution: 80x45 | Charset: Classic | Mode: Luminance
  ```
- Copy-to-clipboard button
- Download as `.txt` file

#### ANSI Text (.ans)

- Characters wrapped in ANSI escape sequences for terminal color
- Supports 8-color, 256-color, and 24-bit truecolor modes (user-selectable)
- Copy-to-clipboard button (for direct paste into terminal)
- Download as `.ans` file
- Preview rendered in a terminal-style monospace display in the browser

#### HTML (.html)

- Self-contained HTML file with inline CSS
- Characters in `<pre>` block with `<span>` elements for per-character color styling
- Configurable font size and font family in output
- Dark/light background toggle
- Copy as HTML snippet (for embedding) or download as standalone `.html` file

#### PNG (.png)

- Renders the ASCII art onto a `<canvas>` element and exports as PNG
- Configurable: background color, font size, font family, padding
- Transparent background option
- Resolution scales with font size (e.g., 12px font at 80 cols ≈ 960px wide)
- Download button

### 7.2 Video/Animation Outputs

#### Animated GIF (.gif)

- Generated client-side using a library such as `gif.js` or `modern-gif`
- Each frame is rendered to canvas then captured
- Configurable: frame delay (derived from target FPS), loop count, color depth
- Quality/size tradeoff slider
- Download button
- **Warning shown for long videos** (> 30s at 10 FPS = 300 frames): estimated file size and processing time

#### WebM Video (.webm)

- Captured via `MediaRecorder` API from a canvas element playing the ASCII frames
- Much smaller file sizes than GIF for equivalent quality
- Configurable bitrate
- Download button

#### Frame Sequence (.zip)

- ZIP archive containing one `.txt` or `.ans` file per frame
- Filenames zero-padded: `frame_0001.txt`, `frame_0002.txt`, ...
- Includes a `metadata.json` with frame count, FPS, resolution, and settings used
- Useful for: CLI playback scripts, custom integrations, archival
- Download as `.zip` (generated client-side via `JSZip` or `fflate`)

#### Real-Time Browser Playback

- Not an export format — this is the live preview in the main canvas
- Renders ASCII frames in a `<pre>` element or canvas at the target FPS
- Play/pause, seek bar, frame-by-frame step controls
- Fullscreen mode

---

## 8. User Interface

### 8.1 Layout

```
┌────────────────────────────────────────────────────────────┐
│  Header: Logo / Title              [Theme Toggle] [About]  │
├──────────────┬─────────────────────────────────────────────┤
│              │                                             │
│  Settings    │            Main Canvas                      │
│  Sidebar     │                                             │
│  (280px)     │   ┌───────────────────────────────────┐     │
│              │   │                                   │     │
│  ┌────────┐  │   │        ASCII Art Preview          │     │
│  │ Input  │  │   │        (Live / Real-time)         │     │
│  ├────────┤  │   │                                   │     │
│  │ Render │  │   │                                   │     │
│  ├────────┤  │   └───────────────────────────────────┘     │
│  │ Chars  │  │                                             │
│  ├────────┤  │   ┌─────────────────────────────────────┐   │
│  │ Color  │  │   │  Video Controls (if video loaded)   │   │
│  ├────────┤  │   │  [▶] [⏸] ────●──────── 01:23/03:45 │   │
│  │ Video  │  │   └─────────────────────────────────────┘   │
│  ├────────┤  │                                             │
│  │ Export │  │   ┌─────────────────────────────────────┐   │
│  └────────┘  │   │  Export Bar                         │   │
│              │   │  [TXT] [ANSI] [HTML] [PNG] [GIF]    │   │
│              │   └─────────────────────────────────────┘   │
├──────────────┴─────────────────────────────────────────────┤
│  Footer: Status bar (processing state, dimensions, FPS)    │
└────────────────────────────────────────────────────────────┘
```

### 8.2 Sidebar Sections

The sidebar uses collapsible accordion sections. All sections are expanded by default on first load.

**Input Section:**
- Drag-and-drop zone (also accepts click-to-browse)
- URL input field with "Fetch" button
- Paste hint text ("or paste an image with Ctrl+V")
- Source info display: filename, dimensions, format, duration (video)

**Rendering Section:**
- Rendering mode selector: Luminance | Edge Detection | Dithered
- Edge detection threshold slider (visible when edge mode active)
- Dithering strength slider (visible when dithering mode active)
- Invert toggle

**Resolution Section:**
- Output width slider + number input
- Aspect ratio correction slider
- Lock aspect ratio toggle
- Calculated output dimensions display (e.g., "80 × 45 characters")

**Character Set Section:**
- Preset dropdown selector
- Custom character input field (shown when "Custom" is selected)
- Visual density preview strip
- Character count display

**Color Section:**
- Mode selector: Monochrome | Foreground | Full Color
- Color quantization dropdown (8 / 16 / 256 / Truecolor)
- Foreground/background color pickers (for monochrome mode)

**Video Section (visible when video loaded):**
- Target FPS slider
- Playback speed slider
- Frame range dual slider
- Loop toggle
- Current frame / total frames display

**Export Section:**
- Format buttons with icons
- Format-specific options (expand on selection):
  - ANSI: color depth selector
  - HTML: font size, font family, background color
  - PNG: font size, background color, transparent toggle
  - GIF: quality slider, loop toggle
  - WebM: bitrate slider
  - Frames: format per frame (txt/ans), include metadata toggle
- "Copy to Clipboard" button (for text-based formats)
- "Download" button

### 8.3 Main Canvas

- Monospace `<pre>` element for text-mode preview, or `<canvas>` for colored/PNG preview
- Auto-scales to fit available space while maintaining character grid proportions
- Shows source image as a faded background overlay (toggle-able) for comparison
- Zoom controls: fit-to-view (default), 1:1, zoom in/out
- For video: playback transport bar below the canvas

### 8.4 Interactions

- **Live preview:** All setting changes trigger a debounced re-render (150ms debounce for sliders, immediate for toggles/selects)
- **Drag and drop:** Works on the entire canvas area; visual indicator on dragover
- **Keyboard shortcuts:**
  - `Space` — play/pause (video)
  - `←` / `→` — frame step (video)
  - `Ctrl+C` — copy current output to clipboard
  - `Ctrl+S` — download current output in last-used format
  - `I` — toggle invert
  - `1–6` — switch rendering presets
- **Responsive:** Sidebar collapses to bottom sheet on viewports < 1024px wide

### 8.5 Theme

- Light and dark mode, defaulting to system preference
- Dark mode uses a dark neutral background with the ASCII art in light text (terminal aesthetic)
- Light mode uses white background with dark text

---

## 9. Technical Architecture

### 9.1 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | React 19 + TypeScript | Broad ecosystem, strong typing, future-proof |
| Bundler | Vite 6 | Fast HMR, native ESM, excellent Worker support |
| Styling | Tailwind CSS 4 | Rapid UI development, consistent design system |
| State Management | Zustand | Lightweight, minimal boilerplate, good for reactive settings |
| Web Workers | Native `Worker` API via Vite | Offload pixel processing from UI thread |
| Canvas | OffscreenCanvas (with fallback) | Zero-copy pixel data transfer to Workers |
| GIF Encoding | `modern-gif` or `gif.js` | Client-side animated GIF generation |
| ZIP Generation | `fflate` | Fast client-side ZIP creation for frame export |
| Video Recording | `MediaRecorder` API | Native WebM capture from canvas |
| Icons | Lucide React | Clean, consistent icon set |

### 9.2 Project Structure

```
src/
├── app/
│   ├── App.tsx                    # Root component
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Canvas.tsx
│   │   └── Footer.tsx
│   └── theme/
│       └── ThemeProvider.tsx
├── features/
│   ├── input/
│   │   ├── components/            # DragDrop, URLInput, ClipboardHandler
│   │   └── hooks/                 # useFileInput, useURLFetch, useClipboard
│   ├── settings/
│   │   ├── components/            # RenderSettings, ResolutionControls, CharsetPicker, ColorControls, VideoControls
│   │   ├── store.ts               # Zustand store for all settings
│   │   └── presets.ts             # Character set presets, default configs
│   ├── renderer/
│   │   ├── engine/
│   │   │   ├── sampler.ts         # Pixel grid sampling logic
│   │   │   ├── luminance.ts       # Luminance mapping
│   │   │   ├── edge-detect.ts     # Sobel edge detection
│   │   │   ├── dither.ts          # Floyd-Steinberg dithering
│   │   │   └── mapper.ts          # Character mapping
│   │   ├── worker/
│   │   │   ├── render.worker.ts   # Web Worker entry point
│   │   │   └── protocol.ts        # Worker message types
│   │   └── hooks/
│   │       ├── useRenderer.ts     # Main rendering hook
│   │       └── useVideoFrames.ts  # Video frame extraction
│   ├── preview/
│   │   ├── components/            # TextPreview, CanvasPreview, VideoTransport
│   │   └── hooks/                 # usePreviewScale, usePlayback
│   └── export/
│       ├── components/            # ExportBar, FormatOptions
│       ├── formatters/
│       │   ├── plaintext.ts       # .txt output
│       │   ├── ansi.ts            # ANSI escape code output
│       │   ├── html.ts            # Standalone HTML output
│       │   ├── png.ts             # Canvas-to-PNG rendering
│       │   ├── gif.ts             # Animated GIF encoding
│       │   ├── webm.ts            # MediaRecorder WebM capture
│       │   └── frames.ts          # ZIP frame sequence
│       └── hooks/
│           └── useExport.ts       # Export orchestration
├── shared/
│   ├── types/                     # Shared TypeScript types
│   ├── utils/                     # Color math, debounce, etc.
│   └── ui/                        # Reusable UI primitives (Slider, Toggle, Select)
└── index.tsx
```

### 9.3 Data Flow

```
User adjusts setting
        │
        ▼
Zustand store updates
        │
        ▼
useRenderer hook reacts (150ms debounce for continuous controls)
        │
        ▼
Source image/frame drawn to OffscreenCanvas
        │
        ▼
ImageData transferred to Web Worker (zero-copy via transferable)
        │
        ▼
Worker: sample → [edge detect] → [dither] → map to characters
        │
        ▼
Worker posts back: CharacterGrid { char, fg?, bg? }[][]
        │
        ▼
Preview component renders grid as <pre> or <canvas>
```

### 9.4 Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Still image render | < 100ms | For 80-col output from a typical photo |
| Live preview update | < 200ms end-to-end | Including debounce + render + paint |
| Video frame processing | < 33ms per frame | To sustain 30 FPS preview |
| GIF export (100 frames) | < 10s | With progress indicator |
| Memory usage | < 500 MB | For a 3-minute 1080p video source |
| Initial page load | < 2s | Code-split, lazy-load export formatters |

### 9.5 Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full support including OffscreenCanvas |
| Firefox | 105+ | OffscreenCanvas support added |
| Safari | 16.4+ | OffscreenCanvas support added |
| Edge | 90+ | Chromium-based, matches Chrome |

Fallback: If `OffscreenCanvas` is unavailable, processing falls back to main-thread canvas with `requestIdleCallback` chunking to maintain UI responsiveness.

---

## 10. Core Data Types

```typescript
interface RenderSettings {
  // Resolution
  outputWidth: number;              // 20–300
  aspectRatioCorrection: number;    // 0.3–1.0
  lockAspectRatio: boolean;

  // Rendering (flags — see §5.3.4 for valid combinations)
  enableLuminance: boolean;         // default: true
  enableEdge: boolean;              // default: false
  enableDithering: boolean;         // default: false (mutually exclusive with enableEdge)
  edgeThreshold: number;            // 0–255
  ditheringStrength: number;        // 0–100
  invertRamp: boolean;

  // Characters
  charsetPreset: string;            // preset key or 'custom'
  customCharset: string;            // user-defined ramp

  // Color
  colorMode: 'mono' | 'foreground' | 'full';
  colorDepth: 8 | 16 | 256 | 'truecolor';
  monoFgColor: string;              // hex
  monoBgColor: string;              // hex

  // Video
  targetFPS: number;                // 1–30
  playbackSpeed: number;            // 0.25–4.0
  frameRange: [number, number];     // start%, end%
  loop: boolean;
}

interface CharacterCell {
  char: string;
  fg?: [number, number, number];    // RGB foreground
  bg?: [number, number, number];    // RGB background
}

type CharacterGrid = CharacterCell[][];

interface RenderResult {
  grid: CharacterGrid;
  width: number;                    // columns
  height: number;                   // rows
  renderTimeMs: number;
}

interface ExportOptions {
  format: 'txt' | 'ansi' | 'html' | 'png' | 'gif' | 'webm' | 'frames';
  ansiColorDepth?: 8 | 16 | 256 | 'truecolor';
  htmlFontSize?: number;
  htmlFontFamily?: string;
  htmlBackground?: string;
  pngFontSize?: number;
  pngBackground?: string | 'transparent';
  gifQuality?: number;              // 1–30
  gifLoop?: boolean;
  webmBitrate?: number;
  framesFormat?: 'txt' | 'ans';
  includeMetadata?: boolean;
}
```

---

## 11. Rendering Algorithm Detail

### 11.1 Grid Sampling

Given an input image of dimensions `W × H` and target output of `cols` columns:

```
cellWidth  = W / cols
cellHeight = cellWidth / aspectRatioCorrection
rows       = floor(H / cellHeight)
```

For each cell `(col, row)`, sample the pixel region:

```
x0 = col * cellWidth
y0 = row * cellHeight
x1 = x0 + cellWidth
y1 = y0 + cellHeight
```

**Sampling strategy:** Average all pixels in the region (box filter). For performance, subsample at most 4×4 pixels per cell when the cell area exceeds 16 pixels.

### 11.2 Luminance Mapping

1. Compute cell luminance `L` from averaged RGB
2. Normalize to charset index: `charIndex = floor(L / 255 * (charsetLength - 1))`
3. If inverted: `charIndex = charsetLength - 1 - charIndex`
4. Output character: `charset[charIndex]`

### 11.3 Edge Detection (Sobel)

Apply Sobel kernels to the luminance grid:

```
Gx = [[-1, 0, 1],     Gy = [[-1, -2, -1],
      [-2, 0, 2],           [ 0,  0,  0],
      [-1, 0, 1]]           [ 1,  2,  1]]

magnitude = sqrt(Gx² + Gy²)
direction = atan2(Gy, Gx)
```

If `magnitude > threshold`, select an edge character based on `direction`:
- ~0° or ~180° → `-`
- ~90° or ~270° → `|`
- ~45° → `/`
- ~135° → `\`
- Junctions → `+`

### 11.4 Floyd-Steinberg Dithering

After computing luminance for each cell, before mapping to a character:

1. Quantize `L` to the nearest character's target luminance
2. Compute error: `error = L - quantizedL`
3. Distribute error to neighboring cells:
   - right:        `+= error * 7/16`
   - bottom-left:  `+= error * 3/16`
   - bottom:       `+= error * 5/16`
   - bottom-right: `+= error * 1/16`
4. Process cells left-to-right, top-to-bottom

---

## 12. Export Format Details

### 12.1 ANSI Escape Codes

**8-color mode:**
```
\033[30m  (black)  through  \033[37m  (white)
```

**256-color mode:**
```
\033[38;5;{n}m  (foreground)
\033[48;5;{n}m  (background)
```

**Truecolor (24-bit):**
```
\033[38;2;{r};{g};{b}m  (foreground)
\033[48;2;{r};{g};{b}m  (background)
```

Each row ends with `\033[0m\n` (reset + newline).

### 12.2 HTML Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: {bgColor}; display: flex; justify-content: center; }
    pre { font-family: {fontFamily}; font-size: {fontSize}px; line-height: 1.0; letter-spacing: 0; }
    /* Per-character spans with inline color styles */
  </style>
</head>
<body><pre>{content}</pre></body>
</html>
```

### 12.3 Frame Sequence metadata.json

```json
{
  "version": "1.0",
  "source": "video.mp4",
  "frameCount": 150,
  "fps": 10,
  "duration": 15.0,
  "resolution": { "cols": 80, "rows": 45 },
  "settings": { /* full RenderSettings snapshot */ },
  "generatedAt": "2026-02-11T14:30:00Z"
}
```

---

## 13. Error Handling

| Scenario | Behavior |
|----------|----------|
| Unsupported file format | Toast notification with supported formats list |
| CORS-blocked URL | Toast with explanation + suggestion to download and re-upload |
| Video codec not supported | Toast explaining browser limitation, suggest converting to MP4/WebM |
| File too large (> 200 MB) | Warning toast with option to proceed anyway |
| Worker crash | Auto-restart worker, retry render, show error after 3 failures |
| GIF export runs out of memory | Show error with suggestion to reduce resolution, FPS, or frame range |
| Clipboard paste fails | Silent fail (no error shown; paste event simply not handled) |

---

## 14. Future Considerations (Post-v1)

These are explicitly out of scope for v1 but should not be precluded by architectural decisions:

- **WebAssembly rendering core** (Rust) for 5–10× performance improvement on pixel processing
- **Webcam / screen capture** as an input source for real-time ASCII video
- **Preset sharing** via URL parameters encoding the full settings state
- **CLI companion tool** (Node.js or Rust) that uses the same rendering engine for headless conversion
- **PWA / offline support** via service worker
- **Plugin system** for custom rendering modes or output formats
- **Batch processing** for converting multiple images
- **Custom font rendering** using user-uploaded monospace fonts for PNG output
- **Braille sub-pixel rendering** where each braille character encodes a 2×4 pixel block rather than a single luminance sample

---

## 15. Deployment

### 15.1 Build

Vite produces a static build output (`dist/`) with no server-side dependencies.

```bash
npm run build    # → dist/
```

### 15.2 Infrastructure

| Component | Technology |
|-----------|-----------|
| Host machine | Mac Studio M1 Max (homelab) |
| Static file server | Caddy or `npx serve dist/` |
| Tunnel | Cloudflare Tunnel (exposes local server to public domain) |
| Domain | `glyph.{yourdomain}` (subdomain on existing Cloudflare-managed domain) |

### 15.3 Deployment Flow

```
git push → (optional: GitHub Actions builds) → copy dist/ to Mac Studio → Caddy serves static files → Cloudflare Tunnel exposes to internet
```

Since Glyph is fully client-side, the server's only job is serving static files. There is no runtime backend, no database, and no server-side processing. Cloudflare's edge caching will handle most requests without hitting the tunnel.

**Recommended Caddy config:**

```
glyph.yourdomain.com {
  root * /path/to/glyph/dist
  file_server
  encode gzip
  header {
    Cache-Control "public, max-age=3600"
    Cross-Origin-Opener-Policy "same-origin"
    Cross-Origin-Embedder-Policy "require-corp"
  }
}
```

The COOP/COEP headers enable `SharedArrayBuffer`, which is required for optimal `OffscreenCanvas` + Web Worker performance.

---

## 16. Resolved Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Project name** | Glyph | Short, memorable, describes the core concept |
| **Deployment** | Mac Studio + Cloudflare Tunnel | Leverages existing homelab infrastructure |
| **License** | TBD | To be decided if/when open-sourced |
| **Analytics** | TBD | To be decided based on audience |
| **Accessibility** | Keyboard-navigable settings, ARIA labels on all controls | Full WCAG for a visual tool is limited, but settings panel should be fully accessible |
| **UI Component Library** | shadcn/ui + Radix primitives, styled with Tailwind | Pre-built accessible components (accordion, slider, select, toggle, color picker) for the settings sidebar. Avoids reinventing complex widgets and ensures accessibility out of the box. |
| **Rendering Mode Data Model** | Separate boolean flags (`enableLuminance`, `enableEdge`, `enableDithering`) replacing the single `mode` enum | Naturally represents the combination table (§5.3.4). UI renders as checkboxes with invalid combos (edge + dithering) disabled. Cleaner than a 4-value enum with an implicit combination rule. |
| **Braille Rendering (v1)** | Sub-pixel dot encoding (2×4 binary dot grid per character) | Each braille character encodes a 2×4 pixel block as binary dots, giving ~2× horizontal and ~4× vertical effective resolution vs. standard density mapping. Requires a separate rendering path in the Character Mapper. |
| **Testing Strategy** | Vitest unit tests for the core rendering engine | Cover the algorithms in `renderer/engine/` (sampler, luminance, edge detection, dithering, mapper, braille encoder). Skip UI/integration tests for v1. |
