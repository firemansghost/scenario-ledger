"use client";

export interface CycleRowWithDays {
  cycleLabel: string;
  bottom: string;
  halving: string;
  peak: string;
  nextBottom: string;
  bullDays?: number;
  bearDays?: number;
  halvingToPeakDays?: number;
}

interface BtcCycleTableProps {
  cycles: CycleRowWithDays[];
}

export function BtcCycleTable({ cycles }: BtcCycleTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-700 bg-zinc-900/50">
            <th className="p-3 font-medium">Cycle</th>
            <th className="p-3 font-medium">Bottom</th>
            <th className="p-3 font-medium">Halving</th>
            <th className="p-3 font-medium">Peak</th>
            <th className="p-3 font-medium">Next bottom</th>
            {cycles.some((c) => c.halvingToPeakDays != null) && (
              <>
                <th className="p-3 font-medium">Bull (days)</th>
                <th className="p-3 font-medium">Bear (days)</th>
                <th className="p-3 font-medium">Halving→Peak (days)</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {cycles.map((row, i) => (
            <tr key={i} className="border-b border-zinc-800">
              <td className="p-3">{row.cycleLabel}</td>
              <td className="p-3 font-mono">{row.bottom}</td>
              <td className="p-3 font-mono">{row.halving}</td>
              <td className="p-3 font-mono">{row.peak}</td>
              <td className="p-3 font-mono">{row.nextBottom}</td>
              {cycles.some((c) => c.halvingToPeakDays != null) && (
                <>
                  <td className="p-3 font-mono">{row.bullDays ?? "—"}</td>
                  <td className="p-3 font-mono">{row.bearDays ?? "—"}</td>
                  <td className="p-3 font-mono">{row.halvingToPeakDays ?? "—"}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
