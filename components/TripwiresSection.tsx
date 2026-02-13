import type { TripwireResult } from "@/lib/tripwireStatus";

interface TripwiresSectionProps {
  checkpoints: string[];
  invalidations: string[];
  id?: string;
  tripwireResults?: TripwireResult[];
}

function StatusPill({ status }: { status: TripwireResult["status"] }) {
  const styles: Record<TripwireResult["status"], string> = {
    confirming: "bg-emerald-900/50 text-emerald-300",
    watching: "bg-amber-900/50 text-amber-300",
    risk: "bg-rose-900/50 text-rose-300",
    unknown: "bg-zinc-700/50 text-zinc-500",
  };
  const labels: Record<TripwireResult["status"], string> = {
    confirming: "Confirming",
    watching: "Watching",
    risk: "Risk",
    unknown: "Unknown",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function TripwireItem({ r }: { r: TripwireResult }) {
  return (
    <li className="space-y-0.5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={r.status} />
        <span>{r.text}</span>
      </div>
      {r.reason && <p className="text-xs text-zinc-500">{r.reason}</p>}
    </li>
  );
}

export function TripwiresSection({
  checkpoints,
  invalidations,
  id = "tripwires",
  tripwireResults,
}: TripwiresSectionProps) {
  const checkpointResults = tripwireResults?.filter((r) => r.kind === "checkpoint") ?? [];
  const invalidationResults = tripwireResults?.filter((r) => r.kind === "invalidation") ?? [];
  const hasResults = tripwireResults && tripwireResults.length > 0;

  return (
    <section id={id} className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-400">Tripwires</h3>
      <p className="text-xs text-zinc-500">
        Status is heuristic: derived from alignment + evidence. Not auto-verified.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">
            <span className="rounded bg-zinc-700/50 px-1.5 py-0.5">Checkpoint</span>
          </p>
          <ul className="space-y-2 text-sm text-zinc-300">
            {hasResults && checkpointResults.length > 0
              ? checkpointResults.slice(0, 3).map((r, i) => <TripwireItem key={i} r={r} />)
              : checkpoints.slice(0, 3).map((c, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-zinc-500">•</span>
                    <span>{c}</span>
                  </li>
                ))}
            {checkpoints.length === 0 && <li className="text-zinc-500">—</li>}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">
            <span className="rounded bg-zinc-700/50 px-1.5 py-0.5">Invalidation</span>
          </p>
          <ul className="space-y-2 text-sm text-zinc-300">
            {hasResults && invalidationResults.length > 0
              ? invalidationResults.slice(0, 3).map((r, i) => <TripwireItem key={i} r={r} />)
              : invalidations.slice(0, 3).map((inv, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-zinc-500">•</span>
                    <span>{inv}</span>
                  </li>
                ))}
            {invalidations.length === 0 && <li className="text-zinc-500">—</li>}
          </ul>
        </div>
      </div>
      {(checkpoints.length > 3 || invalidations.length > 3) && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-300">
            Show all tripwires
          </summary>
          <div className="mt-3 grid gap-6 md:grid-cols-2">
            <div>
              <ul className="space-y-2 text-sm text-zinc-300">
                {hasResults && checkpointResults.length > 0
                  ? checkpointResults.map((r, i) => <TripwireItem key={i} r={r} />)
                  : checkpoints.map((c, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-zinc-500">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
              </ul>
            </div>
            <div>
              <ul className="space-y-2 text-sm text-zinc-300">
                {hasResults && invalidationResults.length > 0
                  ? invalidationResults.map((r, i) => <TripwireItem key={i} r={r} />)
                  : invalidations.map((inv, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-zinc-500">•</span>
                        <span>{inv}</span>
                      </li>
                    ))}
              </ul>
            </div>
          </div>
        </details>
      )}
    </section>
  );
}
