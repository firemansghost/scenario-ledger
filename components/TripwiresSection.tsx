interface TripwiresSectionProps {
  checkpoints: string[];
  invalidations: string[];
  id?: string;
}

export function TripwiresSection({
  checkpoints,
  invalidations,
  id = "tripwires",
}: TripwiresSectionProps) {
  const topCheckpoints = checkpoints.slice(0, 3);
  const topInvalidations = invalidations.slice(0, 3);

  return (
    <section id={id} className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-400">Tripwires</h3>
      <p className="text-xs text-zinc-500">
        These are the conditions we watch to confirm the path — or admit we&apos;re wrong.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">Checkpoints</p>
          <ul className="space-y-1 text-sm text-zinc-300">
            {topCheckpoints.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span>✅</span>
                <span>{c}</span>
              </li>
            ))}
            {topCheckpoints.length === 0 && <li className="text-zinc-500">—</li>}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">Invalidations</p>
          <ul className="space-y-1 text-sm text-zinc-300">
            {topInvalidations.map((inv, i) => (
              <li key={i} className="flex gap-2">
                <span>🚫</span>
                <span>{inv}</span>
              </li>
            ))}
            {topInvalidations.length === 0 && <li className="text-zinc-500">—</li>}
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
              <ul className="space-y-1 text-sm text-zinc-300">
                {checkpoints.map((c, i) => (
                  <li key={i} className="flex gap-2">
                    <span>✅</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ul className="space-y-1 text-sm text-zinc-300">
                {invalidations.map((inv, i) => (
                  <li key={i} className="flex gap-2">
                    <span>🚫</span>
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
