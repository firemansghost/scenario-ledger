import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import type { ForecastConfig, PeriodBand } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ForecastDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient();
  const { data: forecast } = await supabase.from("forecasts").select("*").eq("id", id).single();
  if (!forecast) {
    return (
      <div>
        <p className="text-zinc-400">Forecast not found.</p>
        <Link href="/forecasts" className="text-sm text-zinc-400 hover:text-white">
          ← Back to list
        </Link>
      </div>
    );
  }

  const config = forecast.config as ForecastConfig;
  const factor = config.meta?.spxToSpyFactor ?? 0.1;
  const scenarios = config.scenarios;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/forecasts" className="text-sm text-zinc-400 hover:text-white">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold">{forecast.name}</h1>
        {forecast.is_active && (
          <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-xs text-emerald-400">
            active
          </span>
        )}
      </div>
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="mb-2 font-medium">Meta</h2>
        <p className="text-sm text-zinc-400">SPX/SPY factor: {factor}</p>
        {config.meta?.equityProxyNote && (
          <p className="mt-1 text-xs text-zinc-500">{config.meta.equityProxyNote}</p>
        )}
      </section>
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="mb-3 font-medium">Period bands</h2>
        {scenarios &&
          (["base", "bull", "bear"] as const).map((sc) => (
            <div key={sc} className="mb-4">
              <h3 className="text-sm font-medium capitalize text-zinc-300">{sc}</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {(scenarios[sc]?.periods ?? []).map((p: PeriodBand, i: number) => (
                  <li key={i} className="rounded border border-zinc-700 p-2">
                    <span className="text-zinc-400">{p.label}</span> {p.start} → {p.end}
                    <br />
                    BTC USD: {p.btcRangeUsd.low}–{p.btcRangeUsd.high} · SPX: {p.spxRange.low}–{p.spxRange.high} ·
                    SPY approx: {p.spyRangeApprox.low}–{p.spyRangeApprox.high}
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </section>
      {config.athWindows && Array.isArray(config.athWindows) && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 font-medium">ATH windows</h2>
          <ul className="space-y-2 text-sm text-zinc-400">
            {(config.athWindows as { key?: string; label?: string; displayRange?: string }[]).map((w, i) => (
              <li key={w.key ?? i}>
                {w.label}: {w.displayRange}
              </li>
            ))}
          </ul>
        </section>
      )}
      {config.timeline2026 && Array.isArray(config.timeline2026) && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 font-medium">Timeline 2026</h2>
          <ul className="space-y-1 text-sm text-zinc-400">
            {(config.timeline2026 as { label?: string; theme?: string }[]).map((t, i) => (
              <li key={i}>
                {t.label}: {t.theme}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
