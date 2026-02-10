import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabaseServer";

function requireAdminSecret(req: Request): boolean {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "") ?? req.headers.get("x-admin-secret") ?? "";
  const expected = process.env.ADMIN_SECRET;
  return Boolean(expected && secret === expected);
}

export async function POST(req: Request) {
  if (process.env.ADMIN_SECRET && !requireAdminSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const series_key = body.series_key as string | undefined;
  const dt = body.dt as string | undefined;
  const value = body.value as number | undefined;
  const reason = (body.reason as string) ?? null;

  if (!series_key?.trim() || !dt || value === undefined || !Number.isFinite(value)) {
    return NextResponse.json({ error: "Missing or invalid series_key, dt, value" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("manual_overrides")
    .upsert({ series_key: series_key.trim(), dt, value, reason }, { onConflict: "series_key,dt" })
    .select("id, series_key, dt, value, reason, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  if (process.env.ADMIN_SECRET && !requireAdminSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const id = body.id as string | undefined;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("manual_overrides").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
