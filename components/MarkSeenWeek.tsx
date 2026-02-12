"use client";

import { useEffect } from "react";
import { markWeekSeen } from "@/lib/streak";

interface MarkSeenWeekProps {
  weekEnding: string;
  shareMode?: boolean;
}

/** Renders nothing. On mount, marks the week as seen in localStorage (unless share mode). */
export function MarkSeenWeek({ weekEnding, shareMode = false }: MarkSeenWeekProps) {
  useEffect(() => {
    if (shareMode) return;
    markWeekSeen(weekEnding);
  }, [weekEnding, shareMode]);

  return null;
}
