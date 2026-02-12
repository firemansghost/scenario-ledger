interface TimeboxProgressProps {
  start: string;
  end: string;
  now: Date;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sm = s.toLocaleString("en-US", { month: "short" });
  const em = e.toLocaleString("en-US", { month: "short" });
  const sd = s.getDate();
  const ed = e.getDate();
  const sy = s.getFullYear();
  if (sy === e.getFullYear()) {
    return `${sm} ${sd} → ${em} ${ed}`;
  }
  return `${sm} ${sd} → ${em} ${ed}, ${e.getFullYear()}`;
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export function TimeboxProgress({ start, end, now }: TimeboxProgressProps) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const totalMs = endDate.getTime() - startDate.getTime();
  const elapsedMs = now.getTime() - startDate.getTime();
  let progress = totalMs > 0 ? elapsedMs / totalMs : 0;
  progress = Math.max(0, Math.min(1, progress));

  const daysLeft = daysBetween(now, endDate);
  const daysLeftStr =
    daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? "Last day" : "Ended";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-mono text-zinc-400">{formatDateRange(start, end)}</span>
        <span className="text-xs text-zinc-500">{daysLeftStr}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-zinc-600 transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
