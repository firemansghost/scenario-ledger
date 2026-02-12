"use client";

import { useEffect, useState } from "react";
import { isNerdModeEnabled } from "@/lib/nerdMode";
import { markWeekSeen, computeStreakStats, loadSeenWeeks, saveSeenWeeks, type StreakStats } from "@/lib/streak";

interface StreakMeterCardProps {
  checkinWeek?: string | null;
  shareMode?: boolean;
  nerdMode?: boolean;
}

export function StreakMeterCard({ checkinWeek, shareMode = false, nerdMode: nerdModeProp }: StreakMeterCardProps) {
  const [stats, setStats] = useState<StreakStats | null>(null);
  const [nerdMode, setNerdMode] = useState(nerdModeProp ?? false);

  useEffect(() => {
    if (nerdModeProp != null) return;
    setNerdMode(isNerdModeEnabled());
  }, [nerdModeProp]);

  useEffect(() => {
    if (shareMode) return;
    if (checkinWeek) {
      const { stats: s } = markWeekSeen(checkinWeek);
      setStats(s);
    } else {
      const weeks = loadSeenWeeks();
      setStats(computeStreakStats(weeks));
    }
  }, [checkinWeek, shareMode]);

  if (shareMode) return null;
  if (!stats) return null;

  const handleReset = () => {
    saveSeenWeeks([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("scenarioledger_last_checkin_week");
      localStorage.removeItem("scenarioledger_longest_streak");
    }
    setStats({ currentStreak: 0, longestStreak: 0, checkedLast8: 0 });
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-base font-medium">Weekly streak</h2>
      {stats.lastCheckinWeek ? (
        <>
          <p className="mt-2 text-2xl font-semibold text-zinc-200">
            You checked in {stats.currentStreak} {stats.currentStreak === 1 ? "week" : "weeks"} in a row.
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {stats.currentStreak}-week streak · Longest: {stats.longestStreak}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Checked {stats.checkedLast8} of last 8 weeks
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-500 transition-all"
              style={{ width: `${(stats.checkedLast8 / 8) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-600">Local-only. This is just for you.</p>
          {nerdMode && (
            <button
              type="button"
              onClick={handleReset}
              className="mt-2 text-xs text-zinc-600 hover:text-zinc-400 underline"
            >
              Reset
            </button>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">Start your streak</p>
      )}
    </div>
  );
}
