# Plan B: UI/UX Polish & Settings Fixes

## Scope
UI component fixes, settings panel improvements, export flow fix, sidebar polish.

## File Ownership
This plan exclusively owns these files:
- `src/app/layout/Header.tsx`
- `src/app/layout/Footer.tsx` (DELETE)
- `src/app/layout/Sidebar.tsx`
- `src/app/App.tsx` (remove Footer import if present)
- `src/features/export/components/ExportBar.tsx`
- `src/features/export/components/FormatOptions.tsx`
- `src/features/export/hooks/useExport.ts`
- `src/features/input/components/ClipboardHandler.tsx`
- `src/features/input/components/InputControls.tsx`
- `src/features/input/components/URLInput.tsx`
- `src/features/settings/components/RenderSettings.tsx`
- `src/features/settings/components/CharsetPicker.tsx`
- `src/features/settings/components/ColorControls.tsx`
- `src/features/settings/store.ts`
- `src/features/preview/components/TextPreview.tsx`
- `src/features/preview/components/CanvasPreview.tsx`

## Changes

### 1. ExportBar immediate-fire fix (ExportBar.tsx)
**Bug**: `handleExport()` calls `exportAs()` immediately AND opens FormatOptions, making options useless.
- Change flow: clicking a format button sets `selectedFormat` and opens FormatOptions panel.
- Add an explicit "Export" / "Download" button inside FormatOptions that triggers `exportAs()` after options are configured.
- The sidebar ExportBar buttons become format selectors, not export triggers.

### 2. Export progress reset on error (useExport.ts)
**Bug**: `setProgress(0)` never called in catch block.
- Add `setProgress(0)` in the catch block of the export function.

### 3. isAnimationExport dedup (useExport.ts)
**Code quality**: The `state.animation.enabled && state.animation.effects.length > 0 && (sourceInfo?.type !== 'video' || !sourceInfo.duration)` expression appears 3 times.
- Extract to `const isAnimationExport = ...` before the switch statement.

### 4. Dead About button (Header.tsx)
**Bug**: No onClick handler.
- Add a simple About modal showing: app name, version, brief description, link to project.
- Use a dialog/modal pattern consistent with FormatModal.

### 5. Dead Footer.tsx removal
**Dead code**: Footer.tsx exists but is never imported.
- Delete `src/app/layout/Footer.tsx`.
- Verify no imports reference it (check App.tsx, any barrel exports).

### 6. Sidebar default sections (Sidebar.tsx)
**UX**: All 8+ sections open by default is overwhelming.
- Default to only Input and Export sections open.
- Other sections (Render, Resolution, Characters, Color, Video, Animation, Crop) start collapsed.
- User can expand as needed.

### 7. Charset section visibility (Sidebar.tsx)
**Spec gap §8.2**: Charset section hidden for standard presets.
- Remove the conditional that hides the charset section for non-custom/non-word presets.
- Always show the Character Set section so density preview strip is visible.

### 8. Edge/Dithering mutual exclusion explanation (RenderSettings.tsx)
**UX**: Disabled toggle with no explanation.
- Add a small inline note when one is enabled: "Disable [Edge Detection/Dithering] to enable this option."
- Use a muted text style below the disabled toggle.

### 9. Silent clipboard paste failure (ClipboardHandler.tsx)
**UX**: URL paste errors swallowed silently.
- Add toast notification on CORS/fetch failures: "Could not load pasted URL. Try downloading the image and uploading it directly."

### 10. Loaded filename + source info display (InputControls.tsx)
**Spec gap §8.2**: No filename, dimensions, format, or duration shown.
- After a file is loaded, show: filename, image dimensions (e.g., "1920x1080"), format (e.g., "JPEG"), duration for video.
- Display below the file input / clear button area.
- Source info available from store's sourceInfo state.

### 11. CORS error suggestion (URLInput.tsx)
**Spec gap §4.2**: Missing "download and re-upload" suggestion.
- Append to the existing CORS error toast: "Try downloading the image and uploading it directly."

### 12. Font consistency (TextPreview.tsx, CanvasPreview.tsx)
**UX**: TextPreview uses 'IBM Plex Mono' 10px, CanvasPreview uses 'monospace' 12px.
- Standardize both to the same font stack: `'IBM Plex Mono', 'Courier New', monospace`.
- Use the same base font size (or derive from a shared constant).

### 13. Custom charset validation (CharsetPicker.tsx)
**Spec gap §6.2**: No deduplication or minimum 2-char validation.
- Silently deduplicate characters on input change.
- Show validation message if fewer than 2 unique characters.
- Prevent rendering with invalid charset.

### 14. Mono color palettes (ColorControls.tsx)
**New feature**: Named palette presets for mono mode.
- Add a palette selector above the fg/bg color pickers when in mono mode.
- Presets: "Terminal Green" (#00ff00/#000000), "Amber CRT" (#ffb000/#000000), "Paper White" (#333333/#f5f5dc), "Dracula" (#f8f8f2/#282a36), "Solarized" (#839496/#002b36).
- Selecting a preset fills the fg/bg pickers. Custom colors remain available.

### 15. PNG export options (FormatOptions.tsx)
**Spec gap §7.1**: Missing font family picker and padding control.
- Add font family dropdown: 'IBM Plex Mono', 'Courier New', 'monospace', 'Fira Code'.
- Add padding slider: 0–64px, default 16px.
- Wire these options into the PNG formatter's export call.

### 16. GIF quality slider label fix (FormatOptions.tsx)
**UX**: Lower number = better quality is counter-intuitive.
- Invert the display: show "Quality: High / Medium / Low" labels.
- Or remap the slider so higher = better quality (invert the value before passing to the encoder).

### 17. Export progress improvements (ExportBar.tsx)
**UX**: 1px progress bar with no percentage or format label.
- Show percentage text next to progress bar.
- Show format name during export (e.g., "Exporting GIF... 45%").

### 18. Settings persistence (store.ts)
**New feature**: Save settings to localStorage so they survive page refresh.
- Add `zustand/middleware` `persist` to the store.
- Persist only `RenderSettings` and theme preference, not source media or transient state.
- Add `saturation` and `hueShift` fields to RenderSettings (for Plan A's adjustments.ts changes).

### 19. Markdown copy option (useExport.ts or FormatModal integration)
**New feature**: Add "Copy as Markdown" option in the copy/export flow.
- Import `formatMarkdownCodeBlock` from plaintext.ts (created in Plan A).
- Add as an option in the copy menu/modal.

## Acceptance Criteria
- `npx tsc --noEmit` passes
- `npm test` passes
- ExportBar flow works: select format → configure options → trigger export
- Settings persist across page refresh
- All visual changes are consistent with existing terminal aesthetic
