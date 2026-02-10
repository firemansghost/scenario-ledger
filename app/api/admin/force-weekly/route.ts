import { NextResponse } from "next/server";
import { runWeeklyPipeline } from "@/lib/weeklyPipeline";

function requireAdminSecret(req: Request): boolean {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "") ?? req.headers.get("x-admin-secret") ?? "";
  const expected = process.env.ADMIN_SECRET;
  return Boolean(expected && secret === expected);
}

/**
 * Force-run weekly ingest (most recent Friday). Requires ADMIN_SECRET when set.
 */
export async function POST(req: Request) {
  if (process.env.ADMIN_SECRET && !requireAdminSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runWeeklyPipeline();
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
