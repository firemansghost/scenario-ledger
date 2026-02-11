"use client";

import { useEffect, useState } from "react";
import { isNerdModeEnabled } from "@/lib/nerdMode";

interface AlignmentNerdExtraProps {
  spxEquiv: number | null;
  spyClose: number | null;
  factor: number;
}

export function AlignmentNerdExtra({ spxEquiv, spyClose, factor }: AlignmentNerdExtraProps) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(isNerdModeEnabled());
  }, []);
  if (!show) return null;
  return (
    <div className="rounded border border-zinc-700 bg-zinc-800/50 p-2 text-sm">
      <p className="mb-1 text-zinc-500">Show SPX-equivalent (approx)</p>
      <dl className="grid gap-1">
        <div>
          <dt className="text-zinc-500">SPX equiv / SPY / factor</dt>
          <dd className="font-mono text-zinc-300">
            {spxEquiv != null ? Number(spxEquiv).toFixed(2) : "—"} / {spyClose != null ? Number(spyClose).toFixed(2) : "—"} / {factor}
          </dd>
        </div>
      </dl>
      <p className="mt-1 text-xs text-zinc-500">SPX ≈ SPY × factor. Bands are defined in SPX space; we compare SPY to band via this factor.</p>
    </div>
  );
}
