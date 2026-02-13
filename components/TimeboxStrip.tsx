import Link from "next/link";
import { derivePeriodLabel } from "@/lib/periodLabels";
import type { PeriodBand } from "@/lib/types";

interface TimeboxStripProps {
  periods: PeriodBand[];
  currentIndex: number;
  shareMode?: boolean;
}

export function TimeboxStrip({ periods, currentIndex, shareMode = false }: TimeboxStripProps) {
  if (!periods?.length) return null;

  const baseHref = shareMode ? "/predictions?share=1" : "/predictions";

  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((p, i) => {
        const label = derivePeriodLabel(p.start, p.end, p.label);
        const isCurrent = i === currentIndex;
        const isPast = i < currentIndex;
        return (
          <Link
            key={i}
            href={`${baseHref}#timebox-${i}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              isCurrent
                ? "bg-amber-600/40 text-amber-200 ring-1 ring-amber-500/50"
                : isPast
                  ? "bg-zinc-800/50 text-zinc-500"
                  : "bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600/50 hover:text-zinc-200"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
