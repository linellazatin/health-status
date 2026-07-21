# Health Status Dashboard (for MyPeptideApp)

Personal health tracking dashboard displaying peptide therapy data and health metrics.

## What It Does

- **Latest Weight Display**: Shows most recent weight measurement with trend indicator (up/down/stable)
- **Health Summary Cards**: Total readings, first/latest weight, change in kg and percentage
- **Dose Progression Table**: Paginated table of all injections with dates, doses, and injection sites
- **Weight Trend Chart**: SVG line chart of all weight readings with interactive hover tooltips
- **Health Metrics Table**: Displays tracked health metrics with dates and values

## How It Works

### Data Ingestion

The app reads CSV export files directly from the repository:

- `mypeptideapp_peptide_logs.csv` - Peptide injection records
- `mypeptideapp_health_metrics.csv` - Health metric measurements

Data is parsed using **PapaParse** library to handle CSV parsing in the browser.

### Frontend Rendering

- Vanilla JavaScript with PapaParse for CSV processing
- Dynamic table generation from parsed CSV data
- Weight trend calculation and visualization
- Paginated dose progression table
- SVG weight trend line chart with interactive hover tooltips
- No backend required - all processing happens client-side

## Infrastructure

### Hosting: Cloudflare Pages

Deployed as a static asset site using **Cloudflare Pages**.

### Configuration: Wrangler

Uses `wrangler.jsonc` for Cloudflare deployment:

- Assets directory: root (`.`)
- Node.js compatibility flags enabled
- Observability tracking enabled

### Deployment

Drop-and-deploy static files to Cloudflare Pages. No build step required in current configuration.

## Data Source

Data exported from **MyPeptideApp** (https://mypeptideapp.com/landing).
