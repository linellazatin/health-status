---
name: health
description: Personal health tracking dashboard with warm terminal aesthetic — data-dense, shadowless, Fira Code metadata.
colors:
  bg: "#0d0d0b"
  bg-raised: "#17170f"
  fg: "#f2efe6"
  fg-dim: "#8c8a7d"
  line: "#2b2a24"
  accent-yellow: "#e8c14a"
  accent-orange: "#e2712b"
  accent-green: "#6fae6b"
typography:
  display:
    fontFamily: "-apple-system, 'Segoe UI', system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "-apple-system, 'Segoe UI', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  mono:
    fontFamily: "'Fira Code', ui-monospace, 'SF Mono', 'Menlo', 'Consolas', monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  none: "0px"
  sm: "3px"
  md: "6px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
---

# Design System: Health Dashboard

## Overview

A personal health tracking dashboard operating in **Operate** mode. The visitor completes a task: checking health metrics, reviewing dose progression, tracking weight trends over time.

**Creative North Star: "The Personal Data Ledger"**

The design inherits the openlines "Terminal Record" aesthetic — warm near-black canvas, hairline borders, dot-only accent signals — adapted for data-dense dashboard use.

**Key Characteristics:**
- Near-black `#0d0d0b` ground with warm off-white `#f2efe6` text
- Fira Code monospace for all metadata, labels, timestamps, table headers
- System sans for data values and content
- Shadowless flat surfaces
- 6px colored dots as the only accent signals
- Section eyebrow labels format: `01 — SECTION NAME`
- Data-dense tables with hover states

## Colors

### Surface
| Token | Value | Usage |
|-------|-------|-------|
| bg | `#0d0d0b` | Page background, ground |
| bg-raised | `#17170f` | Cards, table hover, chip backgrounds |
| line | `#2b2a24` | All borders, dividers |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| fg | `#f2efe6` | Primary text |
| fg-dim | `#8c8a7d` | Secondary text, metadata, timestamps |

### Accents (Dot-Only)
| Token | Value | Usage |
|-------|-------|-------|
| accent-yellow | `#e8c14a` | Static indicators, focus rings |
| accent-orange | `#e2712b` | Attention, weight gain |
| accent-green | `#6fae6b` | Positive, weight loss, active |

**The Dot-Only Rule:** Accent colors appear exclusively on 6px circular dots or SVG stroke fills.

## Typography

**Content:** System sans (`-apple-system, "Segoe UI", system-ui, sans-serif`)
**Chrome:** Fira Code (`'Fira Code', ui-monospace, ...`)

| Role | Font | Size | Weight | Usage |
|------|------|------|--------|-------|
| Page Title | sans | 28px | 600 | Page heading |
| Stat Value | sans | 3.5rem | 700 | Current weight |
| Body/Data | sans | 16px | 400 | Table cells, dates, doses |
| Eyebrow | mono | 11px | 400 | Section labels |
| Table Header | mono | 10px | 500 | Column labels |
| Metadata | mono | 11px | 400 | Timestamps, footer |

## Layout

- Container max-width: **960px**
- Padding: `0 24px` (desktop), `0 16px` (mobile)
- Summary cards: `repeat(auto-fit, minmax(200px, 1fr))`
- Section spacing: 24px margin-bottom

## Elevation & Depth

**Completely flat.** No shadows. Depth conveyed by surface tone steps and hairline borders only.

## Shapes

| Element | Radius |
|---------|--------|
| Cards | 6px |
| Buttons/Chips | 3px |
| Dots | 50% |
| Structure | 0px |

## Components

### Card
- bg-raised background
- 1px solid line border
- 6px radius, 24px padding

### Stat Display
- Centered, 3.5rem value
- Yellow unit suffix
- Mono eyebrow label
- Optional trend dot

### Data Table
- Full width, border-collapse
- Mono headers (uppercase, 10px)
- Row hover: bg-raised
- 44px touch targets on pagination

### Accent Dots
- 6px circle
- Green/Orange/Yellow
- Trend and status indicators

## Do's and Don'ts

**Do:**
- Use Fira Code for all timestamps, labels, headers, pagination
- Use hairline borders as only dividers
- Respect prefers-reduced-motion
- Maintain 44px minimum touch targets

**Don't:**
- Use accent colors as text or backgrounds
- Add any shadows
- Swap typeface roles (sans for chrome, mono for content)
- Add third surface tone without justification

## Version

1.0.0 — Initial openlines adaptation for health dashboard
