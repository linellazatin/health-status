<!-- Openlines Design System Migration -->

# Health Dashboard: openlines Design System Migration

## Summary
Migrated health dashboard from GitHub-style dark theme to openlines design system. This creates visual consistency with openlines-web while preserving all data functionality.

## Changes Made

### 1. styles.css (Complete rewrite)
- **Colors**: Shifted from cool GitHub palette (#0f1115, #1c2128) to warm terminal palette (#0d0d0b, #17170f)
- **Typography**: Split between system sans (content) and Fira Code (metadata/all-caps labels)
- **Layout**: Replaced card shadows with hairline borders (#2b2a24)
- **Accents**: Trend arrows replaced with 6px colored dots (yellow/orange/green per openlines dot-only rule)
- **Shadowless**: No box-shadow declarations (except for dot-pulse animation)
- **Reduced motion**: Respects prefers-reduced-motion media query

### 2. index.html (Structural changes)
- Added header with navigation (`.ol-header`, `.ol-brand`, `.ol-nav`)
- Added skip-link for accessibility (`.ol-skip-link`)
- Restructured sections to use `.ol-section` with eyebrow labels
- Updated footer to `.ol-footer` with flexbox layout
- Page title: "lines | health" → "health | lines"

### 3. scripts/fetch.js (Styling updates)
- Updated table rendering to use `.ol-pagination` classes
- Updated trend indicator to use dot-based system:
  - Down (weight loss): `.ol-dot--green`
  - Up (weight gain): `.ol-dot--orange`
  - Flat: `.ol-dot--yellow`
- SVG chart now uses openlines color hex values:
  - Grid lines: #2b2a24
  - Data points: #e2712b (start), #e8c14a (middle), #6fae6b (end)
  - Y-axis labels: Fira Code, #8c8a7d

## Design Tokens Applied

| Token | Value | Usage |
|-------|-------|-------|
| --ol-bg | #0d0d0b | Page background |
| --ol-bg-raised | #17170f | Card/table hover backgrounds |
| --ol-fg | #f2efe6 | Primary text (was #c9d1d9) |
| --ol-fg-dim | #8c8a7d | Secondary text |
| --ol-line | #2b2a24 | All borders |
| --ol-yellow | #e8c14a | Focus, static indicators |
| --ol-orange | #e2712b | Warning/up trends |
| --ol-green | #6fae6b | Success/down trends |

## Components Implemented

- `.ol-header` — Site header with hairline border
- `.ol-nav` — Navigation with yellow underline hover effect
- `.ol-brand` — Site branding (text-only, no logo)
- `.ol-eyebrow` — Section labels (e.g., "01 — DOSE PROGRESSION")
- `.ol-section` — Bordered content cards
- `.ol-dot` — 6px state indicators
- `.ol-pagination` — Page navigation with monospace labels
- `.hero-stat-container` — Hero weight display (retained legacy name)
- `.table-container` — Overflow table scrolling

## Quality Checklist

- [x] No card shadows (hairline borders only)
- [x] Accent colors only on 6px dots
- [x] Fira Code for all chrome (nav, labels, timestamps)
- [x] System sans for content (headings, prose)
- [x] Responsive at 768px, 480px breakpoints
- [x] Reduced-motion support
- [x] Yellow focus outlines visible
- [x] Skip-link present
- [x] Tables scroll on mobile

## Rollback

Backups exist as `*.backup` files:
- `styles.css.backup`
- `index.html.backup`
- `scripts/fetch.js.backup`

To rollback: `cp [file].backup [file]`
