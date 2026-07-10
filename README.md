# Health Status Dashboard

Personal health tracking dashboard displaying peptide therapy data and health metrics.

## What It Does

- **Latest Weight Display**: Shows most recent weight measurement with trend indicator (up/down/stable)
- **Health Summary Cards**: Total readings, first/latest weight, change in kg and percentage
- **Dose Progression Timeline**: Visual timeline of all injections with dates and doses
- **Health Metrics Table**: Displays tracked health metrics with dates and values
- **Pain Level Tracking**: Pain level bar chart per injection with severity labels
- **Weekly Injection Summary**: Bar chart and table of weekly injection counts and total doses

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
- Dose progression timeline rendering
- Pain level tracking with severity indicators
- Weekly injection summary charts
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
