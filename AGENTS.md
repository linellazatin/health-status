# Health Status Dashboard

## What this is
A static personal health tracking dashboard displaying peptide therapy data and health metrics. No build process, no framework, no runtime dependencies beyond PapaParse (CDN).

## Commands
- **Run locally**: `npx serve public/` or `python3 -m http.server -d public`
- **Deploy**: `npx wrangler deploy` (Cloudflare Workers static assets)
- **Test API**: `curl https://api.github.com/repos/linellazatin/health-status/commits?sha=main&per_page=1`

## Architecture
- **Static site** served from `public/` directory
- **Data source**: Two CSV files loaded client-side via PapaParse
  - `mypeptideapp_peptide_logs.csv` - Injection records
  - `mypeptideapp_health_metrics.csv` - Health measurements
- **Visualization**: Vanilla JS, SVG charts, paginated tables
- **Timestamp**: Fetches latest commit from GitHub API on load + every 60s

## Configuration and installation
- **No install required** - all dependencies are CDN-hosted
- **Wrangler**: `wrangler.jsonc` configures Cloudflare deployment
  - Assets directory: `./public`
  - Node.js compatibility flags enabled
  - Observability tracking enabled
- **GitHub Actions**: `.github/workflows/main.yml` runs on push

## Testing and operational quirks
- **Browser cache**: Hard refresh (Ctrl+Shift+R) when testing timestamp updates
- **Timestamp API**: Falls back to "see GitHub" if GitHub API fails
- **CSV parsing**: PapaParse handles malformed CSV gracefully
- **No build artifacts** - deploy directly from `public/`
- **No lint/typecheck** - pure static files

## Key files
- `public/index.html` - Single-page dashboard
- `public/styles.css` - Openlines design system (dark mode, exact blacks)
- `public/scripts/fetch.js` - CSV loading, data processing, chart rendering
- `public/scripts/timestamp.js` - GitHub commit timestamp fetcher
- `public/mypeptideapp_*.csv` - Data exports from MyPeptideApp
- `wrangler.jsonc` - Cloudflare deployment config
- `.github/workflows/main.yml` - CI pipeline

## Data flow
1. CSV files load via `fetch()` from `public/` directory
2. PapaParse converts CSV to JSON arrays
3. `fetch.js` calculates trends, summaries, and renders tables/charts
4. `timestamp.js` fetches GitHub commit date every 60s
5. All rendering happens client-side - no server processing

## Security
- No authentication or user data storage
- CSV files are public assets in the repository
- GitHub API calls are unauthenticated (rate-limited to 60/min)

## Key absences
- No build step
- No linting or type checking
- No test suite
- No documentation beyond README and AGENTS.md
- No Docker or containerization

<!-- opl-init:fp eee8f3046289c3aa -->