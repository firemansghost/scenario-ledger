import type { DataHealthPayload } from "@/lib/dataHealth";
import { getExpectedSeriesLabels } from "@/lib/dataHealth";

interface DataHealthCardProps {
  data: DataHealthPayload;
}

function isStaleMessage(message: string | null): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("no rows") ||
    lower.includes("market closed") ||
    lower.includes("delayed")
  );
}

function statusLabel(status: string, message: string | null): string {
  if (status === "success") return "OK";
  if (status === "failure" && isStaleMessage(message)) return "Stale";
  if (status === "failure") return "Failure";
  return status;
}

function statusClass(label: string): string {
  if (label === "OK") return "text-emerald-400";
  if (label === "Stale") return "text-amber-400";
  return "text-rose-400";
}

export function DataHealthCard({ data }: DataHealthCardProps) {
  const labels = getExpectedSeriesLabels();
  const getLog = (seriesKey: string) =>
    data.dailyRun?.logs.find((l) => l.series_key === seriesKey);

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="mb-3 text-lg font-medium">Data health</h2>

      {/* Daily ingest: last run + per-series */}
      <div className="mb-3">
        <h3 className="mb-2 text-sm font-medium text-zinc-400">Daily ingest</h3>
        {data.dailyRun ? (
          <>
            <p className="mb-2 text-xs text-zinc-500">
              Last run: {new Date(data.dailyRun.runAt).toLocaleString()}
            </p>
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
                  {labels.map(({ key, name, sourceLabel }) => {
                    const log = getLog(key);
                    const latestDt = data.seriesDates[key] ?? "—";
                    const status = log
                      ? statusLabel(log.status, log.message)
                      : "—";
                    const statusCss = status !== "—" ? statusClass(status) : "text-zinc-500";
                    return (
                      <tr key={key} className="border-b border-zinc-800">
                        <td className="py-1.5 pr-3">{name}</td>
                        <td className="py-1.5 pr-3 text-zinc-500">{sourceLabel}</td>
                        <td className={`py-1.5 pr-3 ${statusCss}`}>{status}</td>
                        <td className="py-1.5 font-mono text-zinc-400">{latestDt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-500">No daily run yet.</p>
        )}
      </div>

      {/* Weekly snapshot */}
      <div>
        <h3 className="mb-1 text-sm font-medium text-zinc-400">Weekly snapshot</h3>
        {data.latestSnapshot ? (
          <p className="text-sm text-zinc-300">
            Latest: week ending <strong>{data.latestSnapshot.week_ending}</strong>
            {" · "}
            computed {new Date(data.latestSnapshot.created_at).toLocaleString()}
            {" · "}
            scenario <strong>{data.latestSnapshot.active_scenario}</strong>
          </p>
        ) : (
          <p className="text-sm text-zinc-500">No weekly snapshot yet.</p>
        )}
      </div>
    </section>
  );
}
