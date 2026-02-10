import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const forecastId = body.forecast_id as string | undefined;
  if (!forecastId) {
    return NextResponse.json({ error: "Missing forecast_id" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  await supabase.from("forecasts").update({ is_active: false }).neq("id", forecastId);
  const { error } = await supabase.from("forecasts").update({ is_active: true }).eq("id", forecastId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
