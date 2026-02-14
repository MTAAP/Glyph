# Terminal UI Design Specification

_A reusable style guide for React-based web applications, inspired by the retro-terminal aesthetic of Cyberspace (C¥BERSP∆CE)._

---

## 1. Design Philosophy

The core identity is a **retro CRT terminal** brought into a modern web context. Every element should feel like it belongs in a command-line interface that has been carefully adapted for rich content — not a modern webapp wearing a terminal skin. The guiding principles are:

- **Monospace everything.** Text is the primary visual material.
- **Amber-on-dark.** A warm, phosphor-glow palette evokes vintage CRT displays.
- **Keyboard-first interaction.** The mouse works, but keyboard commands are a first-class citizen.
- **Minimal chrome.** No drop shadows, no gradients, no rounded corners. Borders are 1px solid lines.
- **Information density over decoration.** Metadata (timestamps, word counts, tags) is always visible but never dominant.

---

## 2. Color Palette

The palette is intentionally narrow — a monochromatic amber system with only a few shades.

| Token                  | Value (approx.)        | Usage                                      |
|------------------------|------------------------|---------------------------------------------|
| `--color-bg`           | `#1a1a0e` / `#1c1c10` | Page background, deepest layer              |
| `--color-surface`      | `#2a2a1a` / `#252518`  | Card backgrounds, elevated surfaces         |
| `--color-surface-active`| `#33331f`             | Highlighted / selected card background      |
| `--color-border`       | `#4a4a30` / `#3d3d28`  | All borders — cards, dividers, tags         |
| `--color-text-primary` | `#d4c87a` / `#c8bc6e`  | Primary text — body copy, headings          |
| `--color-text-muted`   | `#8a8260` / `#7a7450`  | Secondary text — timestamps, metadata       |
| `--color-text-link`    | `#e0d48a`              | Links and interactive text (slightly brighter) |
| `--color-accent`       | `#f0e090`              | Active/focused states, selected nav items   |
| `--color-tag-bg`       | transparent            | Tags use border only, no fill               |
| `--color-tag-border`   | `#4a4a30`              | Tag pill borders                            |

### Notes

- There is **no blue, red, or green** in the UI. Everything lives in the yellow-amber-olive spectrum.
- The overall effect is low-contrast but legible — aim for a WCAG contrast ratio of at least 4.5:1 for primary text against the background.
- Images displayed in the UI are **dithered / monochrome** (see Section 9), keeping them within the same tonal range.

---

## 3. Typography

### Font Stack

```css
--font-mono: 'IBM Plex Mono', 'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace;
```

A single monospace family is used **everywhere** — headings, body, metadata, navigation, tags, and the command bar. There is no secondary font. The monospace consistency is the single strongest contributor to the terminal feel.

### Scale

| Role            | Size          | Weight   | Notes                                  |
|-----------------|---------------|----------|----------------------------------------|
| Body text       | `14px`        | 400      | Standard reading size                  |
| Small / meta    | `12px`        | 400      | Timestamps, word counts, tag labels    |
| Heading (post)  | `14px`        | 700      | Usernames — same size, just bold       |
| Page heading    | `16px`–`18px` | 700      | Section titles like "JUKEBOX", "ENTRY" |
| Command bar     | `12px`–`13px` | 400      | Bottom bar text                        |

### Key Rules

- **No font-size hierarchy beyond two steps.** The design avoids large headings entirely. Hierarchy is communicated through weight (bold usernames), color (muted metadata), and spatial position — not size.
- Line-height: `1.5`–`1.6` for body text, `1.3` for compact metadata.
- Letter-spacing: `0` or very slight positive tracking (`0.02em`) on uppercase labels.
- All-caps is used sparingly: section titles ("JUKEBOX", "4 REPLIES", "ENTRY") and keyboard shortcut labels.

---

## 4. Layout System

### Overall Structure

```
┌──────────────────────────────────────────────────┐
│  [Sidebar]  │          [Main Content]            │
│             │                                    │
│  Icon nav   │   Scrollable feed / page content   │
│  (fixed)    │                                    │
│             │                                    │
│             ├────────────────────────────────────│
│             │        [Command Bar]               │
└──────────────────────────────────────────────────┘
```

### Sidebar (Left Navigation)

- Fixed position, narrow width (~`48px` icon-only or ~`160px` expanded with labels).
- Navigation items are **icon + text label** in the expanded state, icon-only when collapsed.
- Icons are **minimal line-art or small pixel-style glyphs** — no filled icons, no color.
- Active item indicated by brighter text color or a subtle left-border accent.
- Collapsible with a `«` / `»` toggle.
- Navigation items in the reference: Feed, Write, Notifications, C-Mail, cIRC, Profile, Journal, Topics, Jukebox, Bookmarks, Guilds, Support, Search, Wiki.

### Main Content Area

- Max-width container: `~860px`–`900px`, centered or left-aligned to the sidebar.
- Vertical feed of cards with consistent spacing (`16px`–`20px` gap).
- No grid layout for text feeds — single column only.
- Grid layout used for media content (e.g. Jukebox uses a 3-column card grid).

### Spacing

| Token              | Value    | Usage                          |
|--------------------|----------|--------------------------------|
| `--space-xs`       | `4px`    | Inline padding, tag internals  |
| `--space-sm`       | `8px`    | Between metadata items         |
| `--space-md`       | `16px`   | Card padding, section gaps     |
| `--space-lg`       | `24px`   | Between cards in a feed        |
| `--space-xl`       | `32px`   | Major section separators       |

---

## 5. Component Specifications

### 5.1 Post / Entry Card

The fundamental content unit.

```
┌─────────────────────────────────────────────────────┐
│ @username ✦          35m ago • 44 words • 1 reply   │
│                                                     │
│ Post body text goes here. Plain monospace text,     │
│ wrapping naturally. Can contain multiple paragraphs.│
│                                                     │
│                        ┌────────┐ ┌──────────────┐  │
│                        │ tag-1  │ │ tag-2        │  │
│                        └────────┘ └──────────────┘  │
│                                                     │
│ [↩] Open  [S] Save                           🔗 💬 │
└─────────────────────────────────────────────────────┘
```

**Specs:**

- Border: `1px solid var(--color-border)`
- Background: `var(--color-surface)` — slightly elevated from page bg
- Padding: `16px`
- **Header row:** username (bold, primary color) left-aligned, metadata (muted) right-aligned
- **Username badges/icons:** small unicode or SVG glyphs after the name (emoji-sized, muted)
- **Body:** standard text, `margin-top: 12px`
- **Tags:** bottom-right aligned, `border: 1px solid var(--color-border)`, `padding: 2px 8px`, monospace text at small size
- **Action row:** bottom of card, `border-top: none`, keyboard shortcuts shown as text labels `[S] Save  [R] Reply`
- **Selected/focused state:** brighter border or slightly lighter background (`var(--color-surface-active)`)

### 5.2 Tags / Pills

```css
.tag {
  display: inline-block;
  border: 1px solid var(--color-border);
  padding: 2px 10px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--color-text-primary);
  background: transparent;
  /* NO border-radius — keep sharp corners */
}
```

### 5.3 Navigation Sidebar Item

```
  [icon]  Label
```

- Icon and label on the same line, or icon-only when collapsed.
- No background on hover — just color change to `var(--color-accent)`.
- Active state: text becomes accent color, optional left-border indicator (`2px solid var(--color-accent)`).
- Icons should be **monoline, small (16px–18px), low-detail** — think of them as terminal-art glyphs.

### 5.4 Thread / Reply View

When viewing a post with replies:

```
┌── ENTRY ──────────────────────────────── [ESC] ──┐
│                                                   │
│  ┌─── Original Post Card ───────────────────┐    │
│  │ @username         2d ago • 12 words       │    │
│  │                                           │    │
│  │ Post content here.                        │    │
│  │                         [tag-1] [tag-2]   │    │
│  │ [S] Save [R] Reply [W] Unwatch            │    │
│  └───────────────────────────────────────────┘    │
│                                                   │
│  4 REPLIES                                        │
│                                                   │
│  ┌─── Reply Card ───────────────────────────┐    │
│  │ @replier           2d ago • 7 words       │    │
│  │ Reply text here.                          │    │
│  │ [S] Save [R] Reply                        │    │
│  └───────────────────────────────────────────┘    │
│                                                   │
│  ... more replies ...                             │
└───────────────────────────────────────────────────┘
```

- Section heading "4 REPLIES" in all-caps, muted color, small size.
- `[ESC]` shown top-right to indicate how to close.
- Replies are the same card component, possibly with slightly less padding or a subtler border.

### 5.5 Media Card (Jukebox Grid)

For image/media-rich sections, a **3-column grid** of cards:

```
┌──────────────────┐
│  [dithered image] │  ← genre tag overlaid top-right
│                   │
│  Title            │
│  Artist           │
│  From @user →     │
└──────────────────┘
```

- Image: fills the card width, aspect ratio ~1:1 or 4:3.
- Images are **dithered/monochrome** (see Section 9).
- Genre tag positioned as an overlay in the top-right corner of the image.
- Text below the image: title (bold), artist (regular), attribution (muted + arrow link).
- Grid gap: `16px`–`20px`.
- No border-radius on the image or the card.

### 5.6 Blockquote / Greentext

For quoted or greentext-style content (as seen in the feed):

```css
.blockquote {
  border-left: 2px solid var(--color-border);
  padding-left: 12px;
  margin-left: 0;
  color: var(--color-text-primary);
  background: rgba(255, 255, 200, 0.03); /* barely visible tint */
}
```

Lines prefixed with `.>` are styled as greentext (though in this palette, they remain amber — just visually grouped by the left border).

---

## 6. Command Bar

The command bar is the **signature interaction pattern** — a persistent bottom bar showing available keyboard shortcuts.

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ [⌘K] Commands  [↑/↓] Navigate  [ESC] Close  [TAB] Select       │
│                                              > ⓘ FAQ  🏠 Netiquette  ♡ Support  ☆ Fortune  ☐ Random │
└──────────────────────────────────────────────────────────────────┘
```

### Specs

```css
.command-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 36px;
  background: var(--color-bg); /* or slightly darker */
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
  z-index: 1000;
}
```

### Keyboard Shortcut Label Style

Shortcut keys are shown in **bracket notation**: `[ESC]`, `[S]`, `[R]`, `[↑/↓]`, `[TAB]`, `[⌘K]`.

```css
.shortcut-key {
  /* Rendered as plain text in brackets, not a styled badge */
  color: var(--color-text-primary); /* slightly brighter than surrounding text */
}
.shortcut-label {
  color: var(--color-text-muted);
  margin-left: 4px;
}
```

Example rendering: `[S] Save  [R] Reply  [W] Unwatch`

The brackets and key are brighter; the action label is muted.

### Right Section

The right side of the command bar contains **quick-access links** with small icons: FAQ, Netiquette, Support, Fortune, Random. These are secondary navigation — always visible but not prominent.

---

## 7. Keyboard Navigation System

This is the critical UX pattern that separates this design from a typical webapp.

### 7.1 Principles

1. **Every screen documents its shortcuts.** The command bar always reflects the current context's available actions.
2. **Arrow keys navigate between items.** `↑`/`↓` move focus between cards in a feed. The focused card gets a visible highlight (brighter border or background shift).
3. **Single-key actions on focused items.** `S` to save, `R` to reply, `O` or `Enter` to open. No modifier keys needed for common actions.
4. **`ESC` always goes back.** Close a thread, dismiss a modal, return to the feed.
5. **`TAB` for selection / cycling.** Moves between interactive zones (sidebar → content → command bar).
6. **Command palette (`⌘K` or `Ctrl+K`).** Opens a search/command overlay for power users.

### 7.2 Implementation Guide

```tsx
// Conceptual structure — adapt to your framework

interface KeyboardContext {
  scope: string;                    // e.g. 'feed', 'thread', 'jukebox'
  shortcuts: Shortcut[];
}

interface Shortcut {
  key: string;                      // e.g. 'ArrowUp', 's', 'Escape'
  label: string;                    // e.g. '[↑]', '[S]', '[ESC]'
  action: string;                   // e.g. 'Navigate up', 'Save', 'Close'
  handler: () => void;
}

// The command bar reads from the current KeyboardContext
// and renders the available shortcuts dynamically.
```

### 7.3 Context-Dependent Shortcuts

| Context       | Key       | Action                  |
|---------------|-----------|-------------------------|
| **Feed**      | `↑` / `↓`| Move focus between posts|
|               | `Enter`   | Open focused post       |
|               | `S`       | Save focused post       |
|               | `TAB`     | Select / multi-select   |
|               | `⌘K`     | Open command palette    |
| **Thread**    | `ESC`     | Close, return to feed   |
|               | `↑` / `↓`| Navigate between replies|
|               | `S`       | Save post/reply         |
|               | `R`       | Reply                   |
|               | `W`       | Watch/Unwatch thread    |
| **Jukebox**   | `←` `→` `↑` `↓` | Grid navigation |
|               | `Enter`   | Play / open track       |
|               | `ESC`     | Back                    |
| **Global**    | `⌘K`     | Command palette         |
|               | `?`       | Show all shortcuts      |

### 7.4 Visual Focus Indicator

When an item is keyboard-focused, apply:

```css
.card:focus-within,
.card[data-focused="true"] {
  border-color: var(--color-accent);
  background: var(--color-surface-active);
  /* No box-shadow, no outline — stay within the terminal aesthetic */
}
```

---

## 8. Iconography

### Style Rules

- **Monoline, geometric, minimal.** Think of icons as what you could represent with a few lines in a terminal.
- Size: `16px`–`20px`, stroke-width `1.5px`.
- Color: inherits from text color (`currentColor`).
- No fills, no multi-color, no gradients.
- Recommended source: [Lucide Icons](https://lucide.dev/) (monoline, open source) or custom SVGs.
- Some icons in the reference use **unicode symbols** or **emoji-style glyphs** directly in text (e.g. ✦, ☆, ♡, ⓘ, 🔑) — this is acceptable and even encouraged for inline metadata.

### Suggested Icon Mappings

| Concept       | Icon approach                          |
|---------------|----------------------------------------|
| Feed          | `≡` or simple list glyph               |
| Write/Compose | `✎` or pencil glyph                   |
| Notifications | `🔔` or bell outline                  |
| Mail          | `✉` or envelope outline               |
| Chat/IRC      | `💬` or speech bubble outline          |
| Profile       | `👤` or simple person outline          |
| Bookmarks     | `🔖` or flag outline                  |
| Search        | `🔍` or magnifying glass outline      |
| Settings      | `⚙` or wrench `🔧`                   |
| Globe/Public  | `🌐` or circle outline                |
| Link          | `🔗` or chain-link glyph              |
| Comment       | `💬` or `▣` speech indicator          |

User badges next to usernames can use small unicode symbols: `✦`, `☾`, `◨`, `⚙`, `🔑`, `✿` etc.

---

## 9. Image Treatment: Dithering

A defining visual feature: all user-uploaded or media images are **dithered into monochrome or duotone**, keeping them within the amber-on-dark palette.

### Approach

Apply a client-side dithering effect using Canvas or CSS filters. The goal is a **1-bit or low-bit look** reminiscent of early computer graphics.

#### Option A: CSS Filter Approximation (simple, imperfect)

```css
.dithered-image {
  filter: grayscale(100%) sepia(60%) contrast(1.3) brightness(0.8);
  mix-blend-mode: luminosity;
}
```

#### Option B: Canvas Dithering (accurate, recommended for media grids)

Apply Floyd-Steinberg or ordered dithering via a `<canvas>` element at render time. Libraries like `ditherJS` or a custom implementation can convert images to the amber palette before displaying.

#### Option C: CSS + SVG Filter (best balance)

```svg
<svg style="display:none">
  <filter id="dither">
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer>
      <feFuncR type="linear" slope="0.83" intercept="0.05"/>
      <feFuncG type="linear" slope="0.78" intercept="0.04"/>
      <feFuncB type="linear" slope="0.48" intercept="0.02"/>
    </feComponentTransfer>
  </filter>
</svg>

<img src="..." style="filter: url(#dither) contrast(1.2);" />
```

This remaps colors into the amber range. Combine with a CSS `contrast()` bump for the crunchy look.

### Image Sizing

- In media grids: fill the card, maintain aspect ratio, `object-fit: cover`.
- In text feeds: images are rare; if present, display inline at reduced width (`max-width: 400px`).
- No border-radius. Images have sharp corners.

---

## 10. Interaction States

All interactive elements use minimal state changes — no dramatic transforms or color shifts.

| State     | Visual Change                                                |
|-----------|--------------------------------------------------------------|
| Default   | `color: var(--color-text-primary); border: 1px solid var(--color-border)` |
| Hover     | `color: var(--color-accent)` — text brightens, nothing else  |
| Focus     | `border-color: var(--color-accent)` — border brightens       |
| Active    | `background: var(--color-surface-active)` — subtle bg shift  |
| Disabled  | `opacity: 0.4`                                               |

**No transitions slower than 100ms.** Interactions should feel snappy and immediate, like a terminal responding to input. Use `transition: color 80ms ease, border-color 80ms ease` at most.

---

## 11. CSS Variables — Complete Token Set

```css
:root {
  /* Colors */
  --color-bg: #1a1a0e;
  --color-surface: #252518;
  --color-surface-active: #30301e;
  --color-border: #4a4a30;
  --color-text-primary: #d4c87a;
  --color-text-muted: #8a8260;
  --color-text-link: #e0d48a;
  --color-accent: #f0e090;
  
  /* Typography */
  --font-mono: 'IBM Plex Mono', 'Fira Code', 'JetBrains Mono', monospace;
  --font-size-xs: 11px;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --line-height-tight: 1.3;
  --line-height-normal: 1.6;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Borders */
  --border: 1px solid var(--color-border);
  --border-radius: 0px; /* sharp corners everywhere */
  
  /* Transitions */
  --transition-fast: 80ms ease;
  
  /* Layout */
  --sidebar-width-collapsed: 48px;
  --sidebar-width-expanded: 160px;
  --content-max-width: 880px;
  --command-bar-height: 36px;
}
```

---

## 12. Responsive Behavior

- **Desktop (>1024px):** Sidebar expanded with labels. 3-column media grid. Full command bar.
- **Tablet (768–1024px):** Sidebar collapsed to icons. 2-column media grid. Command bar simplified.
- **Mobile (<768px):** Sidebar becomes a hamburger/overlay menu. Single-column everything. Command bar shows only the most essential shortcuts. Consider a swipe-based navigation model as a complement to keyboard shortcuts.

On mobile, the keyboard shortcut system is less relevant, so the command bar should adapt to show **tap targets** instead — small icon buttons that perform the same actions.

---

## 13. Do's and Don'ts

### Do

- ✓ Use monospace everywhere, no exceptions
- ✓ Keep corners sharp (border-radius: 0)
- ✓ Show keyboard shortcuts prominently in bracket notation
- ✓ Use 1px borders, never thicker
- ✓ Keep the palette within amber/olive tones
- ✓ Dither or desaturate all images
- ✓ Make metadata visible but muted (timestamps, word counts)
- ✓ Update the command bar contextually based on the current view
- ✓ Use unicode symbols for inline icons and badges
- ✓ Favor information density over whitespace

### Don't

- ✗ Use rounded corners anywhere
- ✗ Add box-shadows or drop-shadows
- ✗ Use gradients (linear, radial, or otherwise)
- ✗ Introduce a secondary typeface
- ✗ Use colorful images — everything goes through the dither/monochrome pipeline
- ✗ Add elaborate hover animations or transforms
- ✗ Use filled/solid icons — always monoline
- ✗ Hide keyboard shortcuts — they should always be discoverable
- ✗ Use large text for headings — hierarchy comes from weight and color, not size

---

## 14. Implementation Checklist

When applying this spec to a new React project:

- [ ] Install and configure the monospace font (e.g. `IBM Plex Mono` via Google Fonts or self-hosted)
- [ ] Set up CSS variables from Section 11 in your global stylesheet
- [ ] Implement the `<CommandBar />` component with dynamic keyboard context
- [ ] Build the `<Card />` component with header (username + metadata), body, tags, and action row
- [ ] Build the `<Sidebar />` with collapsible icon/label navigation
- [ ] Set up a `useKeyboardNavigation` hook for feed-level arrow-key navigation
- [ ] Implement keyboard shortcut scoping (feed vs. thread vs. media grid)
- [ ] Add image dithering pipeline (CSS filter or Canvas-based)
- [ ] Set up the responsive breakpoints from Section 12
- [ ] Verify contrast ratios meet accessibility standards (4.5:1 minimum)
