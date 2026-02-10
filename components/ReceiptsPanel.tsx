"use client";

import { useState } from "react";
import { EvidenceTable } from "@/components/evidence-table";
import type { EvidenceRow } from "@/lib/getEvidenceForWeek";
import type { EvidenceDefinition } from "@/lib/getEvidenceForWeek";

interface ReceiptsPanelProps {
  weekEnding: string;
  indicatorRows: EvidenceRow[];
  definitions: EvidenceDefinition[];
}

export function ReceiptsPanel({
  weekEnding,
  indicatorRows,
  definitions,
}: ReceiptsPanelProps) {
  const [show, setShow] = useState(false);

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="text-sm font-medium text-zinc-300 hover:text-white"
      >
        {show ? "Hide receipts" : "Show receipts"}
      </button>
      {show && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-zinc-500">
            Indicator evidence for week ending {weekEnding}
          </p>
          <EvidenceTable
            indicatorRows={indicatorRows}
            definitions={definitions}
          />
        </div>
      )}
    </section>
  );
}
