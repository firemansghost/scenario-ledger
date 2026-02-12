import { createClient } from "@/lib/supabaseClient";
import { EvidenceTable } from "@/components/evidence-table";

export const revalidate = 60;

export default async function EvidencePage() {
  const supabase = createClient();
  const { data: snapshot } = await supabase
    .from("weekly_snapshots")
    .select("week_ending")
    .order("week_ending", { ascending: false })
    .limit(1)
    .maybeSingle();

  const weekEnding = snapshot?.week_ending ?? null;
  let indicatorRows: { indicator_key: string; value: number | null; delta: number | null; state: string }[] = [];
  let definitions: { key: string; name: string; weights: unknown }[] = [];

  if (weekEnding) {
    const { data: ind } = await supabase
      .from("indicator_weekly")
      .select("indicator_key, value, delta, state")
      .eq("week_ending", weekEnding);
    indicatorRows = ind ?? [];
    const { data: defs } = await supabase.from("indicator_definitions").select("key, name, weights");
    definitions = defs ?? [];
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Evidence</h1>
      {weekEnding ? (
        <>
          <p className="text-sm text-zinc-400">Week ending {weekEnding}</p>
          <EvidenceTable indicatorRows={indicatorRows} definitions={definitions} />
        </>
      ) : (
        <p className="text-zinc-400">No weekly data yet. Run the weekly cron.</p>
      )}
    </div>
  );
}
