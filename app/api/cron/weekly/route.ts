import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabaseServer";
import { getMostRecentFriday } from "@/lib/dates";
import { sanitizeLogMessage } from "@/lib/logSanitize";
import { runWeeklyPipeline } from "@/lib/weeklyPipeline";

/** Vercel Cron invokes GET; delegate to POST so Admin can still call POST. */
export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "") ?? req.headers.get("x-cron-secret") ?? "";
  const expected = process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const weekEnding = getMostRecentFriday();
  const startedAt = new Date();

  const { data: runRow, error: runInsertError } = await supabase
    .from("ingest_runs")
    .insert({
      job: "weekly",
      status: "running",
      week_ending: weekEnding,
      summary: {},
    })
    .select("id")
    .single();

  if (runInsertError || !runRow?.id) {
    return NextResponse.json(
      { error: "Failed to create ingest run", details: runInsertError?.message },
      { status: 500 }
    );
  }
  const runId = runRow.id;

  try {
    const result = await runWeeklyPipeline(weekEnding);
    const finishedAt = new Date();
    await supabase
      .from("ingest_runs")
      .update({
        finished_at: finishedAt.toISOString(),
        status: "success",
        summary: {
          week_ending: result.week_ending,
          active_scenario: result.active_scenario,
          scenario_probs: result.confidence ? { confidence: result.confidence } : undefined,
          indicator_count: 6,
          data_completeness: result.data_completeness,
          duration_ms: finishedAt.getTime() - startedAt.getTime(),
        },
      })
      .eq("id", runId);
    return NextResponse.json({ run_id: runId, ...result, duration_ms: finishedAt.getTime() - startedAt.getTime() });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await supabase
      .from("ingest_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: "failure",
        summary: { error: sanitizeLogMessage(message), duration_ms: Date.now() - startedAt.getTime() },
      })
      .eq("id", runId);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
