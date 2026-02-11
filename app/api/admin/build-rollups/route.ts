import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabaseServer";
import { buildHistoryRollups } from "@/lib/buildHistoryRollups";

function requireAdminSecret(req: Request): boolean {
  const secret =
    req.headers.get("authorization")?.replace("Bearer ", "") ??
    req.headers.get("x-admin-secret") ??
    "";
  const expected = process.env.ADMIN_SECRET;
  return Boolean(expected && secret === expected);
}

/**
 * Build history_rollups (btc_cycle_daycounts_v1, spy_presidential_cycle_v1).
 * Requires ADMIN_SECRET when set. Nerd Mode required to reach Admin UI.
 */
export async function POST(req: Request) {
  if (process.env.ADMIN_SECRET && !requireAdminSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleClient();
    const result = await buildHistoryRollups(supabase);
    return NextResponse.json({
      ok: true,
      lastComputedAt: result.lastComputedAt,
      btcWritten: result.btcWritten,
      spyWritten: result.spyWritten,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Build failed", details: message },
      { status: 500 }
    );
  }
}
