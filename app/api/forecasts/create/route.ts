import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const version = body.version as number | undefined;
  const name = (body.name as string) ?? "Forecast";
  const config = body.config;

  if (version == null || config == null) {
    return NextResponse.json({ error: "Missing version or config" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("forecasts").insert({
    version,
    name,
    is_active: false,
    notes: null,
    config,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
