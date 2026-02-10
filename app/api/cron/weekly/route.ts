import { NextRequest, NextResponse } from "next/server";
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

  try {
    const result = await runWeeklyPipeline();
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
