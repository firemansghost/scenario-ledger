import { createServiceRoleClient } from "@/lib/supabaseServer";
import { DataFetchLogs } from "@/components/data-fetch-logs";
import { AdminTools } from "@/components/admin-tools";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
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

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Admin</h1>

      <AdminTools overrides={overrides ?? []} />

      <section>
        <h2 className="mb-2 font-medium">Data fetch logs</h2>
        <DataFetchLogs logs={logs ?? []} />
      </section>
    </div>
  );
}
