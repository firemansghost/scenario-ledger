"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "scenarioledger_playbook_checked_";

function getStoredKeys(weekEnding: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${weekEnding}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function setStoredKeys(weekEnding: string, keys: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${weekEnding}`,
      JSON.stringify([...keys])
    );
  } catch {
    // ignore
  }
}

export function usePlaybookCheckoff(
  weekEnding: string,
  checkableKeys: string[],
  shareMode: boolean
) {
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(() =>
    shareMode ? new Set() : getStoredKeys(weekEnding)
  );

  useEffect(() => {
    if (shareMode) return;
    setCheckedKeys(getStoredKeys(weekEnding));
  }, [weekEnding, shareMode]);

  const toggle = useCallback(
    (key: string) => {
      if (shareMode) return;
      setCheckedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        setStoredKeys(weekEnding, next);
        return next;
      });
    },
    [weekEnding, shareMode]
  );

  const reset = useCallback(() => {
    if (shareMode) return;
    setCheckedKeys(new Set());
    setStoredKeys(weekEnding, new Set());
  }, [weekEnding, shareMode]);

  const checkedCount = checkableKeys.filter((k) => checkedKeys.has(k)).length;
  const total = checkableKeys.length;

  return {
    checkedKeys,
    toggle,
    reset,
    checkedCount,
    total,
    isChecked: (key: string) => checkedKeys.has(key),
  };
}

interface CheckoffHeaderProps {
  checkedCount: number;
  total: number;
  onReset: () => void;
  nerdMode?: boolean;
}

export function CheckoffHeader({
  checkedCount,
  total,
  onReset,
  nerdMode = false,
}: CheckoffHeaderProps) {
  if (total === 0) return null;
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="text-xs text-zinc-500">
        Checked {checkedCount}/{total}
      </span>
      {nerdMode && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-zinc-500 underline hover:text-zinc-300"
        >
          Reset
        </button>
      )}
    </div>
  );
}
