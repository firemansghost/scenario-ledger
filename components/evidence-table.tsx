interface IndicatorRow {
  indicator_key: string;
  value: number | null;
  delta: number | null;
  state: string;
}

interface DefRow {
  key: string;
  name: string;
  weights: unknown;
}

interface EvidenceTableProps {
  indicatorRows: IndicatorRow[];
  definitions: DefRow[];
}

export function EvidenceTable({ indicatorRows, definitions }: EvidenceTableProps) {
  const defMap = Object.fromEntries(definitions.map((d) => [d.key, d]));

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-700 bg-zinc-900/50">
            <th className="p-3 font-medium">Indicator</th>
            <th className="p-3 font-medium">Value</th>
            <th className="p-3 font-medium">WoW Δ</th>
            <th className="p-3 font-medium">State</th>
            <th className="p-3 font-medium">Scenario impact</th>
          </tr>
        </thead>
        <tbody>
          {indicatorRows.map((row) => {
            const def = defMap[row.indicator_key];
            const weights = def?.weights as Record<string, Record<string, number>> | undefined;
            return (
              <tr key={row.indicator_key} className="border-b border-zinc-800">
                <td className="p-3">
                <span>{def?.name ?? row.indicator_key}</span>
                {def?.name && <span className="ml-1 font-mono text-zinc-500">({row.indicator_key})</span>}
              </td>
                <td className="p-3">{row.value != null ? row.value.toFixed(4) : "—"}</td>
                <td className="p-3">{row.delta != null ? row.delta.toFixed(4) : "—"}</td>
                <td className="p-3">
                  <span
                    className={
                      row.state === "bullish"
                        ? "text-emerald-400"
                        : row.state === "bearish"
                          ? "text-rose-400"
                          : "text-zinc-400"
                    }
                  >
                    {row.state}
                  </span>
                </td>
                <td className="p-3 text-xs text-zinc-500">
                  {weights?.[row.state]
                    ? `bull ${(weights[row.state].bull ?? 0)} / base ${(weights[row.state].base ?? 0)} / bear ${(weights[row.state].bear ?? 0)}`
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {indicatorRows.length > 0 && (
        <div className="border-t border-zinc-800 p-3 text-xs text-zinc-500">
          Checkbox view: counts derived from indicator states and weights (bullish/neutral/bearish).
          {indicatorRows.some((r) => r.indicator_key === "dxy_direction") && (
            <span className="mt-1 block">DTWEXBGS used as proxy for DXY.</span>
          )}
        </div>
      )}
    </div>
  );
}
