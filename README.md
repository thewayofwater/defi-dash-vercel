# DeFi Yield Dashboard

Live dashboard pulling from DeFiLlama's yields API. No backend required.

## Deploy to Vercel (5 minutes)

### Option A: GitHub + Vercel (recommended)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com), sign in with GitHub
3. Click "Add New Project", select the repo
4. Vercel auto-detects Vite -- just click Deploy
5. Done. You'll get a URL like `defi-yield-dashboard.vercel.app`

### Option B: Vercel CLI

```bash
npm install -g vercel
cd defi-dash-vercel
npm install
vercel
```

Follow the prompts. First deploy takes ~60 seconds.

## Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Architecture

- **No backend** -- all data fetched client-side from DeFiLlama
- React + Vite + Recharts
- Four modules: Yield Trends, TVL Heatmap, Stablecoin Index, Rate Environment

## Limitations (frontend-only)

- Historical trends limited to what DeFiLlama provides per pool (no custom aggregated history)
- TVL heatmap shows current state, not net flows over time (needs snapshots)
- No automated alerts or anomaly detection
- Data refreshes on page load (no background polling)

These limitations go away if you add a backend + database layer later.
