import Link from "next/link";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import { NerdGateView } from "@/components/NerdGateView";
import { ShareBlockedView } from "@/components/ShareBlockedView";

export const revalidate = 60;

export default async function RunDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ share?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const shareMode = search?.share === "1";
  const cookieStore = await cookies();
  const nerdMode = cookieStore.get("scenarioledger_nerd")?.value === "1";

  if (shareMode) return <ShareBlockedView />;
  if (!nerdMode) return <NerdGateView />;

  const supabase = createServiceRoleClient();

  const { data: run, error: runError } = await supabase
    .from("ingest_runs")
    .select("id, job, started_at, finished_at, status, target_date, week_ending, summary")
    .eq("id", id)
    .maybeSingle();

  if (runError || !run) notFound();

  const summary = (run.summary ?? {}) as Record<string, unknown>;
  const durationMs =
    typeof summary.duration_ms === "number"
      ? summary.duration_ms
      : run.finished_at
        ? new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()
        : null;

  let logs: { source: string; series_key: string | null; status: string; message: string | null }[] = [];
  if (run.job === "daily") {
    const { data: logRows } = await supabase
      .from("data_fetch_logs")
      .select("source, series_key, status, message")
      .eq("run_id", run.id)
      .order("series_key");
    logs = logRows ?? [];
  }

  const series = summary.series as Record<string, { status: string; source: string; dt?: string }> | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/runs" className="text-sm text-zinc-500 hover:text-white">
          ← Run history
        </Link>
      </div>
      <h1 className="text-xl font-semibold">Run details</h1>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-zinc-500">Run ID</dt>
            <dd className="font-mono">{run.id}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Job</dt>
            <dd>{run.job}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Status</dt>
            <dd>
              <span
                className={
                  run.status === "success"
                    ? "text-emerald-400"
                    : run.status === "partial"
                      ? "text-amber-400"
                      : run.status === "failure"
                        ? "text-rose-400"
                        : "text-zinc-400"
                }
              >
                {run.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Started</dt>
            <dd className="font-mono">{new Date(run.started_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Finished</dt>
            <dd className="font-mono">
              {run.finished_at ? new Date(run.finished_at).toLocaleString() : "—"}
            </dd>
          </div>
          {durationMs != null && (
            <div>
              <dt className="text-zinc-500">Duration</dt>
              <dd className="font-mono">{(durationMs / 1000).toFixed(1)}s</dd>
            </div>
          )}
          {run.job === "daily" && run.target_date && (
            <div>
              <dt className="text-zinc-500">Target date</dt>
              <dd className="font-mono">{String(run.target_date)}</dd>
            </div>
          )}
          {run.job === "weekly" && run.week_ending && (
            <div>
              <dt className="text-zinc-500">Week ending</dt>
              <dd className="font-mono">{String(run.week_ending)}</dd>
              <dd className="mt-1">
                <Link
                  href="/evidence"
                  className="text-xs text-zinc-400 underline hover:text-white"
                >
                  View evidence
                </Link>
              </dd>
            </div>
          )}
        </dl>
      </section>

      {run.job === "daily" && series && Object.keys(series).length > 0 && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 font-medium">Summary (per series)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 text-zinc-400">
                  <th className="pb-1 pr-3 font-medium">Series</th>
                  <th className="pb-1 pr-3 font-medium">Source</th>
                  <th className="pb-1 pr-3 font-medium">Status</th>
                  <th className="pb-1 font-medium">Latest dt</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(series).map(([key, v]) => (
                  <tr key={key} className="border-b border-zinc-800">
                    <td className="py-1.5 pr-3">{key}</td>
                    <td className="py-1.5 pr-3 text-zinc-500">{v.source}</td>
                    <td className="py-1.5 pr-3">{v.status}</td>
                    <td className="py-1.5 font-mono text-zinc-400">{v.dt ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {run.job === "weekly" && summary.active_scenario != null && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 font-medium">Weekly summary</h2>
          <p className="text-sm text-zinc-300">
            Active scenario: <strong>{String(summary.active_scenario)}</strong>
            {summary.data_completeness != null && (
              <> · Data completeness: {(Number(summary.data_completeness) * 100).toFixed(0)}%</>
            )}
            {summary.indicator_count != null && (
              <> · Indicators: {Number(summary.indicator_count)}</>
            )}
          </p>
        </section>
      )}

      {run.job === "daily" && logs.length > 0 && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 font-medium">Data fetch logs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 text-zinc-400">
                  <th className="pb-1 pr-3 font-medium">Source</th>
                  <th className="pb-1 pr-3 font-medium">Series</th>
                  <th className="pb-1 pr-3 font-medium">Status</th>
                  <th className="pb-1 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} className="border-b border-zinc-800">
                    <td className="py-1.5 pr-3">{log.source}</td>
                    <td className="py-1.5 pr-3 font-mono">{log.series_key ?? "—"}</td>
                    <td className="py-1.5 pr-3">{log.status}</td>
                    <td className="max-w-xs truncate py-1.5 text-zinc-500" title={log.message ?? ""}>
                      {log.message ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
