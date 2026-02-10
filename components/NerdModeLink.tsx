"use client";

import { useRouter } from "next/navigation";
import { enableNerdMode } from "@/lib/nerdMode";
import { useState } from "react";

interface NerdModeLinkProps {
  shareMode?: boolean;
}

export function NerdModeLink({ shareMode = false }: NerdModeLinkProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (shareMode) {
      setMessage("Nerd Mode is disabled in share view. Remove ?share=1 to enable.");
      return;
    }
    enableNerdMode();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        className="text-sm text-zinc-500 hover:text-zinc-300 underline"
      >
        Advanced Details (Nerd Mode)
      </button>
      {message && (
        <p className="text-xs text-amber-400" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
