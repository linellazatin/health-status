# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Plain static HTML/CSS/JS, no framework, no build step. Deploy target: Cloudflare Pages.

## Users

Primary user: the site owner (single person) viewing their own health data. Secondary: no other users; this is a personal dashboard.

## Product Purpose

A personal health tracking dashboard for peptide therapy data. Displays weight trends, injection logs, and health metrics from CSV exports. Success means the owner can quickly check their current stats and track progress over time.

## Positioning

Self-controlled personal data viewer. Not a commercial health app. The owner owns the data (CSV files) and the presentation. Works offline with local files, no backend, no accounts, no tracking.

## Operating Context

- Data source: CSV exports from MyPeptideApp (mypeptideapp.com)
- Files: `mypeptideapp_peptide_logs.csv`, `mypeptideapp_health_metrics.csv`
- Static hosting: Cloudflare Pages
- No CMS, no database, no auth
- Content updates by replacing CSV files

## Capabilities and Constraints

- Reads CSV files client-side using PapaParse
- Generates dynamic tables with pagination
- SVG line chart for weight trends
- Responsive design (desktop, tablet, mobile)
- Constraints: CSV files must be present at root; no server-side processing

## Brand Commitments

The `openlines` visual identity: warm terminal aesthetic (near-black #0d0d0b, off-white #f2efe6), Fira Code monospace for metadata, shadowless flat surfaces, dot-only accent colors.

## Evidence on Hand

- `mypeptideapp_peptide_logs.csv` - injection records with dates, doses, sites
- `mypeptideapp_health_metrics.csv` - weight and other metrics with dates
- No fabricated testimonials or benchmark claims

## Product Principles

1. Self-owned data: the owner controls both source data and presentation
2. Low maintenance: static files, no backend to secure or maintain
3. Honest visualization: show data as-is, no smoothing or manipulation
4. Terminal clarity: information-dense, readable at a glance

## Accessibility & Inclusion

No specific requirement established. Implements skip-link, focus outlines, reduced-motion support, semantic tables with proper headers.
