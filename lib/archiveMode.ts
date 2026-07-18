import { NextResponse } from "next/server";

/**
 * ScenarioLedger is preserved as a read-only archive.
 * Set this to true only when intentionally resuming the legacy application.
 */
export const SCENARIO_LEDGER_WRITES_ENABLED = false;

export function archiveWriteDisabledResponse() {
  return NextResponse.json(
    { error: "ScenarioLedger is on hold. Data-changing actions are disabled." },
    { status: 503 }
  );
}
