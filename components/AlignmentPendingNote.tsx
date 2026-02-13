import Link from "next/link";

interface AlignmentPendingNoteProps {
  lastComputedWeekEnding?: string | null;
  nerdMode?: boolean;
}

export function AlignmentPendingNote({
  lastComputedWeekEnding,
  nerdMode = false,
}: AlignmentPendingNoteProps) {
  return (
    <div className="space-y-0.5">
      <p className="text-sm text-zinc-500">Alignment pending (waiting on weekly run).</p>
      {lastComputedWeekEnding && (
        <p className="text-xs text-zinc-600">Last computed: Week ending {lastComputedWeekEnding}</p>
      )}
      {nerdMode && (
        <Link href="/runs" className="text-xs text-zinc-500 underline hover:text-zinc-300">
          Check runs →
        </Link>
      )}
    </div>
  );
}
