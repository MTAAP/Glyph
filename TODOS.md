# TODOS

## Side-by-Side Comparison Mode
**What:** Show two rendering variants side by side (e.g., standard ASCII vs variable typography, proportional vs monospace).
**Why:** Inspired by pretext's three-panel comparison. The Creative/Artist persona benefits from evaluating settings against each other without toggling back and forth.
**Effort:** M (human) / S (CC)
**Priority:** P3
**Depends on:** None
**Context:** chenglou/pretext demo shows proportional vs monospace rendering side by side with the source image. A comparison view in Glyph would let users see how different rendering modes look against each other. Could be implemented as a split-view toggle in the preview area.

## Font-Size as Rendering Dimension
**What:** Per-cell variable font-size (6-16px range) for brightness encoding. Smaller font = less ink = lighter.
**Why:** Pretext's demo uses font-size variation alongside weight/italic/opacity. Adds another axis of brightness control.
**Effort:** L (human) / M (CC)
**Priority:** P2
**Depends on:** Variable typography Phases 1-2 (runtime measurement, font picker)
**Context:** Investigation (2026-03-28) confirmed this requires a layout rewrite across 6 files: CanvasPreview.tsx (significant — batch rendering breaks, baseline drift), TextPreview.tsx (moderate — needs CSS Grid), png.ts, svg.ts, html.ts, formatAnimatedHtml.ts. The core issue is baseline alignment: different font sizes have different baselines. Need a consistent strategy (e.g., baseline-to-top, center vertically, per-cell y-offset) implemented consistently across all 6 renderers. Codex flagged this during CEO review; investigation confirmed the complexity. Deferred from scope.
