import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabaseServer";
import { DataFetchLogs } from "@/components/data-fetch-logs";
import { AdminTools } from "@/components/admin-tools";
import { NerdGateView } from "@/components/NerdGateView";
import { ShareBlockedView } from "@/components/ShareBlockedView";

export const dynamic = "force-dynamic";

export default async function AdminPage({
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
  const { data: logs } = await supabase
    .from("data_fetch_logs")
    .select("id, job, source, series_key, status, message, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: overrides } = await supabase
    .from("manual_overrides")
    .select("id, series_key, dt, value, reason, created_at")
    .order("dt", { ascending: false });

  const { data: rollups } = await supabase
    .from("history_rollups")
    .select("computed_at")
    .order("computed_at", { ascending: false })
    .limit(1);
  const lastRollupBuildAt = rollups?.[0]?.computed_at ?? null;

  const [
    { count: spxCount },
    { data: spxMinRow },
    { data: spxMaxRow },
    { count: spyCount },
    { data: spyMinRow },
    { data: spyMaxRow },
  ] = await Promise.all([
    supabase.from("daily_series").select("dt", { count: "exact", head: true }).eq("series_key", "spx").eq("source", "stooq"),
    supabase.from("daily_series").select("dt").eq("series_key", "spx").eq("source", "stooq").order("dt", { ascending: true }).limit(1),
    supabase.from("daily_series").select("dt").eq("series_key", "spx").eq("source", "stooq").order("dt", { ascending: false }).limit(1),
    supabase.from("daily_series").select("dt", { count: "exact", head: true }).eq("series_key", "spy").eq("source", "stooq"),
    supabase.from("daily_series").select("dt").eq("series_key", "spy").eq("source", "stooq").order("dt", { ascending: true }).limit(1),
    supabase.from("daily_series").select("dt").eq("series_key", "spy").eq("source", "stooq").order("dt", { ascending: false }).limit(1),
  ]);

  const coverage = (count: number | null, minRow: unknown[], maxRow: unknown[]) => {
    const n = count ?? 0;
    return n > 0
      ? {
          present: true,
          rowCount: n,
          minDt: (minRow?.[0] as { dt: string } | undefined)?.dt,
          maxDt: (maxRow?.[0] as { dt: string } | undefined)?.dt,
        }
      : { present: false };
  };

  const spxCoverage = coverage(spxCount, spxMinRow ?? [], spxMaxRow ?? []);
  const spyCoverage = coverage(spyCount, spyMinRow ?? [], spyMaxRow ?? []);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Admin</h1>

      <AdminTools
        overrides={overrides ?? []}
        lastRollupBuildAt={lastRollupBuildAt}
        spxCoverage={spxCoverage}
        spyCoverage={spyCoverage}
      />

      <section>
        <h2 className="mb-2 font-medium">Data fetch logs</h2>
        <DataFetchLogs logs={logs ?? []} />
      </section>
    </div>
  );
}
