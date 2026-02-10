"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const ADMIN_FLAG = "scenarioledger_admin";

export function Nav() {
  const searchParams = useSearchParams();
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (searchParams.get("admin") === "1") {
      localStorage.setItem(ADMIN_FLAG, "1");
      setShowAdmin(true);
    } else {
      setShowAdmin(localStorage.getItem(ADMIN_FLAG) === "1");
    }
  }, [searchParams]);

  return (
    <nav className="mt-4 flex gap-4 text-sm">
      <Link href="/" className="text-muted-foreground hover:text-foreground">
        Dashboard
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
      {showAdmin && (
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          Admin
        </Link>
      )}
    </nav>
  );
}
