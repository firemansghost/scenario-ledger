"use client";

import { useEffect, useState } from "react";
import { isWeekSeen } from "@/lib/streak";

interface SeenWeekBadgeProps {
  weekEnding: string;
}

export function SeenWeekBadge({ weekEnding }: SeenWeekBadgeProps) {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    setSeen(isWeekSeen(weekEnding));
  }, [weekEnding]);

  if (!seen) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-zinc-500" title="You viewed this week">
      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
      Seen
    </span>
  );
}
