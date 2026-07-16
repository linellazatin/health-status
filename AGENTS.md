# AGENTS.md — health-status

## Stack
- Pure static site: `index.html` + `styles.css` + `scripts/fetch.js`
- No build step, no bundler, no package.json
- PapaParse loaded via CDN (`papaparse.min.js` from cdnjs)
- Deployed to Cloudflare Pages via `wrangler.jsonc` (assets dir = `.`)

## Local dev
```bash
npx serve .          # serves at http://localhost:3000
```
No other commands needed. No build, no install.

## Data files
- `mypeptideapp_peptide_logs.csv` — peptide injection records (6+ rows)
- `mypeptideapp_health_metrics.csv` — health metrics, primarily weight (9+ rows)
- Both files have UTF-8 BOM — `fetch.js` strips it before parsing
- CSV headers use quoted fields with spaces: `"Injection Date"`, `"Injection Site"`
- Row order in CSVs: newest at top, oldest at bottom

## fetch.js architecture
- `loadAndRenderCSV(filename, containerId, columnsToShow, onDataLoaded)` — async, uses `fetch(window.location.origin + '/' + filename)` (not `Papa.parse(download:true)`)
- `calcWeightTrend(data)` — sorts **descending** (newest first); `values[0]` = latest, `values[length-1]` = oldest
- `calcHealthSummary(data)` — sorts **ascending** (oldest first); returns `firstDate`, `lastDate`, `prevWeight`, `prevDate` for summary cards
- `getTrendDirection(values)` — expects descending-sorted array; `first = values[length-1]` (oldest), `last = values[0]` (newest)
- Several functions are commented out (not deleted): `calcWeeklyStats`, `calcPainTracking`, `getPainLevelClass`, `getPainLabel`, `formatWeightValue`, `formatDoseValue`, `formatRelativeDate`

## Color conventions
- Weight loss (down) = **green** (`--trend-down: #3fb950`) — goal is to lose weight
- Weight gain (up) = **red** (`--trend-up: #f85149`)
- These are intentionally swapped from typical convention

## HTML containers
| ID | Card |
|----|------|
| `#latest-weight` | Hero stat — latest weight + trend arrow |
| `#summary-grid` | 4 summary cards (Total Readings, First Reading, Since Last Weigh-in, Change) |
| `#logs-container` | Dose Progression table |
| `#weight-trend-container` | SVG line chart |
| `#metrics-container` | Health Metrics table |

## Deployment
- Cloudflare Pages auto-deploys on push to `main`
- CI (`main.yml`) sends a Google Chat notification on every push (uses `GOOGLE_CHAT_WEBHOOK_URL` secret)
- Live URL: `health.llazat.in`
- No secrets needed locally

## Branch workflow
- Feature work on `dev` or `beta` branch, PR into `main`
- Cloudflare Pages deploys from `main`
