# Health Status Dashboard

## What this is
A static personal health dashboard for MyPeptideApp exports. It uses vanilla HTML, CSS, and JavaScript to render weight summaries, dose records, health metrics, and an SVG weight chart in the browser.

## Commands
- **Run locally:** `npx serve public/`
- **Alternative local server:** `python3 -m http.server -d public`
- **Run tests:** `node --test tests/timestamp.test.js`
- **Deploy:** `npx wrangler deploy`

There is no build step. There is no lint or typecheck command.

## Architecture
- `public/` is the complete deployable asset directory.
- `public/index.html` provides the page shell and footer timestamp element.
- `public/scripts/fetch.js` loads the two CSV assets with PapaParse, calculates summaries and trends, renders tables, and builds the SVG chart.
- `public/scripts/timestamp.js` fetches the latest `main` commit from the GitHub API and displays its committer date in the viewer's local timezone as `Last updated: Sun, 13 Sep 2026 @ 03:06:23`.
- `public/styles/styles.css` contains the openlines-inspired dark visual system and responsive dashboard styles.

## Configuration and installation
No package installation is required for the site. PapaParse is loaded from its CDN in `index.html`.

`wrangler.jsonc` deploys `./public` as Cloudflare Workers static assets. Observability is enabled. Files outside `public/` are not deployed as site assets.

## Testing and operational quirks
- Timestamp tests use Node's built-in test runner and mock the browser fetch/DOM boundary.
- The timestamp uses GitHub's unauthenticated API, so rate limits or API failures display `Last updated: see GitHub`.
- Timestamp formatting uses the viewer's local timezone, not UTC.
- CSV files are public browser assets and contain the dashboard's source data.
- Hard-refresh the browser when testing changed static assets through a cached local or deployed page.

## Key files
- `public/index.html` - Dashboard document shell
- `public/scripts/fetch.js` - CSV loading and dashboard rendering
- `public/scripts/timestamp.js` - GitHub commit timestamp
- `public/styles/styles.css` - Page styling and responsive rules
- `public/mypeptideapp_health_metrics.csv` - Health metric data
- `public/mypeptideapp_peptide_logs.csv` - Peptide log data
- `tests/timestamp.test.js` - Timestamp behavior tests
- `wrangler.jsonc` - Cloudflare deployment configuration
- `.github/workflows/main.yml` - Push notification workflow

## Important constraints
Keep all deployable HTML, CSS, JavaScript, CSV, and image assets under `public/`. Keep timestamp ownership in `timestamp.js`; do not reintroduce a competing timestamp updater in `fetch.js`.

<!-- opl-init:fp c29d16e73dad0b75 -->