# DESIGN SYSTEM & VISUAL DIRECTION

## 1. Aesthetic Philosophy: Neo-Swiss Typographic (Light & Dark Modes)
- **Core Vibe:** Objective, architectural, high-contrast, and functional. Inspired by mid-century Swiss International Style (Josef Müller-Brockmann) adapted for cryptographic systems, smart contract architecture, and decentralized infrastructure.
- **Structural Principle:** Everything aligns to an explicit mathematical grid. Asymmetric balance over centered symmetry. Information density is managed through strict typographic hierarchy, hairline rules, and generous negative space—never through decorative cards or shadows.

## 2. Color Tokens (Strict Adherence)
Support both **Architectural Paper (Light)** and **Obsidian Terminal (Dark)** modes via a clean `data-theme="dark"` attribute on `<html>` (defaulting to system preference with a minimal monospace toggle in the header). Do not use standard Tailwind gray scales or gradients.

### Light Mode (`:root`)
- `--bg-primary`: `#F5F5F3` (Warm architectural paper)
- `--bg-secondary`: `#EAEAE6` (Subtle surface shift for row hovers and code blocks)
- `--text-primary`: `#111111` (Ink black for headings and primary copy)
- `--text-secondary`: `#5C5C58` (Muted charcoal for metadata, timestamps, and roles)
- `--border-hairline`: `#D4D4CE` (1px structural grid lines and dividers)
- `--accent-signal`: `#E63B19` (International Swiss vermilion — used sparingly for active states, ETHGlobal badge, or links)

### Dark Mode (`[data-theme="dark"]`)
- `--bg-primary`: `#0D0D0C` (Deep matte carbon / obsidian ink)
- `--bg-secondary`: `#161614` (Subtle elevated slate for table row hovers and inline tags)
- `--text-primary`: `#F2F2EE` (Crisp off-white — avoids harsh pure white `#FFF` eye strain)
- `--text-secondary`: `#8E8E88` (Warm technical gray for commit metadata, stack tags, and dates)
- `--border-hairline`: `#262623` (Crisp 1px dark structural grid lines)
- `--accent-signal`: `#FF4D26` (High-contrast Swiss signal orange-red calibrated for dark surfaces)

## 3. Typography & Hierarchy
Load Google Fonts or local variable fonts for the following pairing:
- **Primary Sans (`--font-sans`):** `Plus Jakarta Sans` or `Inter` (Tight tracking, clean neo-grotesque proportions).
- **Technical Mono (`--font-mono`):** `JetBrains Mono` or `IBM Plex Mono` (Used for index numbers `01..06`, protocol tags, smart contract standards like `ERC-2535`, and theme toggles).

### Type Scale & Rules:
- **Hero Statement:** `clamp(2.25rem, 4.8vw, 4.25rem)`, weight `600`, line-height `1.06`, letter-spacing `-0.03em`. Left-aligned, never centered.
- **Section Headers:** `0.8125rem` (`13px`), uppercase, `font-mono`, letter-spacing `0.08em`, color `--text-secondary`, prefixed with index numbers (e.g., `01 / SELECTED SYSTEMS`).
- **Project & Role Titles:** `1.375rem` (`22px`), weight `500`, letter-spacing `-0.02em`.
- **Body Copy:** `0.9375rem` (`15px`) to `1rem` (`16px`), line-height `1.6`, max-width `62ch`.

## 4. Layout & Grid Architecture
- **Container:** Max-width `1200px`, centered with `24px` (mobile) to `48px` (desktop) horizontal padding.
- **Asymmetric Split Grid:** Use a 12-column CSS Grid (`grid-cols-12`). Place section labels/index metadata in columns `1–3` and primary content in columns `4–12` on desktop.
- **Structural Dividers:** Separate major sections and list rows with crisp `1px solid var(--border-hairline)` horizontal rules.
- **Border Radius:** Strictly `0px` (`rounded-none`) across all buttons, badges, inputs, and containers.

## 5. Component & Interaction Rules
- **Project Index (01 / Selected Work):** Render as an architectural ledger/table rather than visual cards.
  - Desktop Columns: `[01–06 Index]` | `[Project Name & Brief Architecture]` | `[Protocol / Stack Tags]` | `[Link ↗]`.
  - Hovering a row shifts background to `--bg-secondary`, nudges the arrow `2px`, and highlights the index/link in `--accent-signal`.
  - Include an optional expandable drawer or clean detail view for technical notes without breaking the grid.
- **Theme Switcher:** Place a minimal monospace text button in the top-right header: `[ LIGHT / DARK ]` with `0px` radius and `1px` border.
- **Motion:** Fast, mechanical state changes only (`transition-colors duration-150 ease-out`). Zero bounce, zero parallax.

## 6. Explicit Anti-Patterns (STRICTLY FORBIDDEN)
- NO drop shadows (`box-shadow` is banned in both light and dark modes).
- NO rounded corners (`border-radius` must always be `0`).
- NO neon glow effects, cyber gradients, or glassmorphism in dark mode.
- NO centered hero sections or generic "Hi, I'm [Name]" greetings.
- NO generic stock crypto illustrations or floating 3D shapes.

## 7. Technical Writing & Blog Architecture (`03 / WRITING`)
- **Homepage Integration:** Add a `03 / WRITING` section below Experience using the exact same 12-column asymmetric ledger format: `[Date YYYY.MM.DD]` | `[Article Title & Tags]` | `[Read Time]`.
- **Article Reading View (`/writing/[slug]`):**
  - Keep the 12-column asymmetric layout: place sticky article metadata (Published Date, Read Time, Tags, and a minimal Table of Contents) in columns `1–3` on desktop, and the article body in columns `4–10` (strictly capped at `65ch` width for optimal reading).
  - **Code Blocks:** Must have `0px` border radius, `1px solid var(--border-hairline)`, `--bg-secondary` background, and `JetBrains Mono` font. Include a crisp `[ COPY ]` text button in the top-right corner of every code block.
  - **Blockquotes & Callouts:** Left border `2px solid var(--accent-signal)`, `--bg-secondary` background, `0px` radius, no italic serif flourishes.
  - **No Hero Banners:** Never use stock cover images or decorative thumbnails for blog posts. Open directly with monospace metadata, a bold left-aligned title, and a `1px` hairline rule.
