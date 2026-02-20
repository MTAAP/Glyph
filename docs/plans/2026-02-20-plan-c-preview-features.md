# Plan C: Preview Features — Zoom, Overlay, Fullscreen & Shortcuts

## Scope
Canvas/preview area enhancements: zoom controls, source overlay comparison, fullscreen mode, and missing keyboard shortcuts.

## File Ownership
This plan exclusively owns these files:
- `src/app/layout/Canvas.tsx` (render loading indicator + overlay + zoom integration)
- `src/features/preview/hooks/usePreviewScale.ts`
- `src/features/input/components/KeyboardHandler.tsx`
- NEW: `src/features/preview/components/ZoomControls.tsx`
- NEW: `src/features/preview/hooks/useZoom.ts`
- NEW: `src/features/preview/hooks/useFullscreen.ts`
- NEW: `src/features/preview/components/SourceOverlay.tsx`

## Changes

### 1. Render loading indicator (Canvas.tsx)
**UX**: Canvas is blank while rendering; only the footer shows "Rendering..."
- Add a loading overlay to the canvas area when `isRendering` is true and no result exists yet.
- Show a subtle pulsing "Rendering..." text or a minimal spinner in the center of the canvas.
- Once the first render completes, hide the indicator.

### 2. Zoom controls (NEW: useZoom.ts, ZoomControls.tsx)
**Spec gap §8.3**: Only fit-to-view exists.

**useZoom.ts hook:**
- Track zoom level: `scale` (number, default: 'fit')
- Zoom modes: 'fit' (auto-scale to container), '1:1' (actual size), custom scale (0.25x–4x)
- Track pan offset: `{x, y}` for when zoomed past container bounds
- Mouse wheel zoom (Ctrl+scroll or pinch)
- Pan via click-and-drag when zoomed in

**ZoomControls.tsx component:**
- Toolbar overlay at top-right of canvas area
- Buttons: [Fit] [1:1] [+] [-]
- Current zoom percentage display
- Terminal-styled to match the app aesthetic

**Canvas.tsx integration:**
- Replace the current `usePreviewScale` with `useZoom` (or compose them)
- Apply transform: `scale(zoomLevel)` + `translate(panX, panY)` to the preview container
- Container should clip overflow when zoomed in

### 3. Source image overlay comparison (NEW: SourceOverlay.tsx)
**Spec gap §8.3**: No source image as faded background overlay.

**SourceOverlay.tsx component:**
- Renders the source image behind the ASCII preview at matching scale
- Opacity: 30% by default, adjustable or toggle-able
- Activated via a toggle button in the zoom controls toolbar

**Canvas.tsx integration:**
- When overlay is active, render SourceOverlay behind the TextPreview/CanvasPreview
- Both layers must use the same transform (zoom + pan)

### 4. Fullscreen mode (NEW: useFullscreen.ts)
**Spec gap §7.2, §8.3**: No fullscreen mode.

**useFullscreen.ts hook:**
- Uses Fullscreen API (`element.requestFullscreen()`)
- Targets the canvas container element
- Tracks fullscreen state via `fullscreenchange` event
- Falls back gracefully if API unavailable

**Integration:**
- Add fullscreen toggle button to ZoomControls: [⛶] icon
- When fullscreen, hide sidebar and header — only show canvas + zoom controls
- Escape key exits fullscreen (browser default behavior)
- Keyboard shortcut: `F` key (in KeyboardHandler.tsx)

### 5. Missing keyboard shortcuts (KeyboardHandler.tsx)
**Spec gap §8.4**: `I` (invert), `Ctrl+S` (download) not implemented.

- Add `I` / `i` key → toggle `invertRamp` in store
- Add `Ctrl+S` / `Cmd+S` → trigger download in last-used format (or default to TXT)
  - `e.preventDefault()` to override browser save dialog
  - Call the export function from useExport
- Add `F` / `f` key → toggle fullscreen (ties into useFullscreen)
- Add `O` / `o` key → toggle source overlay (ties into SourceOverlay)

### 6. Animation seek controls
**UX gap**: AnimationTransport only has play/pause, no seek.
- This is a stretch goal. If time permits, add a seek slider to AnimationTransport.tsx (file not owned by this plan — would need to coordinate or skip).

## Architecture Notes
- The zoom system composes with existing preview components — TextPreview and CanvasPreview remain unchanged. Zoom is applied as a CSS transform on their container.
- The overlay renders a plain `<img>` element behind the preview, scaled to match.
- Fullscreen uses the native browser API — no custom implementation needed.

## Acceptance Criteria
- `npx tsc --noEmit` passes
- `npm test` passes
- Zoom: mouse wheel zooms, toolbar buttons work, pan works when zoomed in
- Overlay: source image visible behind ASCII art, opacity appropriate, toggle works
- Fullscreen: enters/exits cleanly, escape works, `F` shortcut works
- Shortcuts: `I` toggles invert, `Ctrl+S` downloads, `F` fullscreen, `O` overlay
