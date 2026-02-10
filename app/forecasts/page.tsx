import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { ForecastSelector } from "@/components/forecast-selector";

export const revalidate = 60;

export default async function ForecastsPage() {
  const supabase = createClient();
  const { data: forecasts } = await supabase
    .from("forecasts")
    .select("id, version, name, is_active, created_at")
    .order("version", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Forecast versions</h1>
        <Link
          href="/forecasts/new"
          className="rounded bg-zinc-700 px-3 py-2 text-sm font-medium hover:bg-zinc-600"
        >
          Create new version
        </Link>
      </div>
      <ForecastSelector forecasts={forecasts ?? []} />
      <ul className="space-y-2">
        {(forecasts ?? []).map((f) => (
          <li key={f.id} className="flex items-center gap-4 rounded-lg border border-zinc-800 p-3">
            <span className="font-mono text-zinc-400">v{f.version}</span>
            <span className="font-medium">{f.name}</span>
            {f.is_active && (
              <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-xs text-emerald-400">
                active
              </span>
            )}
            <span className="text-xs text-zinc-500">{new Date(f.created_at).toLocaleDateString()}</span>
            <Link href={`/forecasts/${f.id}`} className="text-sm text-zinc-400 hover:text-white">
              View
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
