# Data Sources

- **BTC**: CoinGecko (free tier). Daily close for target date.
- **SPY**: Stooq first (free), Alpha Vantage fallback (API key). Stooq “no rows” treated as stale (market closed), not failure.
- **VIX, DXY proxy, real yields (FRED), HY spreads (FRED)**: FRED API. Require `FRED_API_KEY`.
- **Manual overrides**: Admin can set overrides for any series+date; overrides take precedence over ingested data.

All ingest runs are logged in `ingest_runs` and `data_fetch_logs`; see Run history (Nerd Mode) for details.
