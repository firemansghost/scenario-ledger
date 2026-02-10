import Link from "next/link";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabaseServer";
import { NerdGateView } from "@/components/NerdGateView";
import { ShareBlockedView } from "@/components/ShareBlockedView";

export const revalidate = 60;

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{ share?: string }>;
}) {
  const params = await searchParams;
  const shareMode = params?.share === "1";
  const cookieStore = await cookies();
  const nerdMode = cookieStore.get("scenarioledger_nerd")?.value === "1";

  if (shareMode) return <ShareBlockedView />;
  if (!nerdMode) return <NerdGateView />;

  const supabase = createServiceRoleClient();
  const { data: runs } = await supabase
    .from("ingest_runs")
    .select("id, job, started_at, finished_at, status, target_date, week_ending, summary")
    .order("started_at", { ascending: false })
    .limit(30);

  function statusClass(s: string) {
    if (s === "success") return "bg-emerald-900/50 text-emerald-400 border-emerald-700";
    if (s === "partial") return "bg-amber-900/50 text-amber-400 border-amber-700";
    if (s === "failure") return "bg-rose-900/50 text-rose-400 border-rose-700";
    return "bg-zinc-800 text-zinc-400 border-zinc-600";
  }

  function durationMs(r: { started_at: string; finished_at: string | null; summary?: { duration_ms?: number } | null }) {
    const ms = r.summary && typeof (r.summary as { duration_ms?: number }).duration_ms === "number"
      ? (r.summary as { duration_ms: number }).duration_ms
      : r.finished_at ? new Date(r.finished_at).getTime() - new Date(r.started_at).getTime() : null;
    return ms != null ? `${(ms / 1000).toFixed(1)}s` : "—";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Run history</h1>
      <p className="text-sm text-zinc-400">Last 30 daily and weekly ingests.</p>
      {runs && runs.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-700 bg-zinc-900/50">
                <th className="p-3 font-medium">Started</th>
                <th className="p-3 font-medium">Job</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Duration</th>
                <th className="p-3 font-medium">Target / week</th>
                <th className="p-3 font-medium">Counts</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => {
                const counts = r.summary && typeof r.summary === "object" && "counts" in r.summary
                  ? (r.summary as { counts?: { success?: number; failure?: number } }).counts
                  : null;
                return (
                  <tr key={r.id} className="border-b border-zinc-800">
                    <td className="p-3 font-mono text-zinc-300">
                      {new Date(r.started_at).toLocaleString()}
                    </td>
                    <td className="p-3">{r.job}</td>
                    <td className="p-3">
                      <span className={`rounded border px-2 py-0.5 text-xs font-medium ${statusClass(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-zinc-400">{durationMs(r)}</td>
                    <td className="p-3 font-mono text-zinc-400">
                      {r.job === "daily" ? (r.target_date ?? "—") : (r.week_ending ?? "—")}
                    </td>
                    <td className="p-3 text-zinc-500">
                      {counts
                        ? `${counts.success ?? 0} ok / ${counts.failure ?? 0} fail`
                        : "—"}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/runs/${r.id}`}
                        className="text-zinc-400 underline hover:text-white"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-zinc-500">No runs yet. Trigger daily or weekly ingest from Admin.</p>
      )}
    </div>
  );
}
