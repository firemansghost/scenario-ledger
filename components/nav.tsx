"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { isNerdModeEnabled } from "@/lib/nerdMode";
import { NerdModeLink } from "@/components/NerdModeLink";

export function Nav() {
  const searchParams = useSearchParams();
  const shareMode = searchParams.get("share") === "1";
  const [nerdMode, setNerdMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setNerdMode(isNerdModeEnabled());
  }, []);

  const showAdvanced = nerdMode && !shareMode;

  return (
    <>
      <nav className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          Dashboard
        </Link>
        <Link href="/briefs" className="text-muted-foreground hover:text-foreground">
          Briefs
        </Link>
        <Link href="/predictions" className="text-muted-foreground hover:text-foreground">
          Predictions
        </Link>
        <Link href="/evidence" className="text-muted-foreground hover:text-foreground">
          Evidence
        </Link>
        <Link href="/alignment" className="text-muted-foreground hover:text-foreground">
          Alignment
        </Link>
        <Link href="/forecasts" className="text-muted-foreground hover:text-foreground">
          Forecasts
        </Link>
        <Link href="/learn" className="text-muted-foreground hover:text-foreground">
          Learn
        </Link>
        {showAdvanced && (
          <Link href="/runs" className="text-muted-foreground hover:text-foreground">
            Runs
          </Link>
        )}
        {showAdvanced && (
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            Admin
          </Link>
        )}
      </nav>
      <div className="mt-2">
        <NerdModeLink shareMode={shareMode} />
      </div>
    </>
  );
}
