"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BuildRollupsButtonProps {
  adminSecret?: string;
  onSuccess?: () => void;
}

export function BuildRollupsButton({ adminSecret, onSuccess }: BuildRollupsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const headers: HeadersInit = {};
      if (adminSecret) headers["x-admin-secret"] = adminSecret;
      const res = await fetch("/api/admin/build-rollups", { method: "POST", headers });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(`Built. Last: ${data.lastComputedAt ? new Date(data.lastComputedAt).toLocaleString() : "—"}`);
        onSuccess?.();
        router.refresh();
      } else {
        setMessage(data.error ?? data.details ?? `HTTP ${res.status}`);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={run}
        disabled={loading}
        className="rounded bg-zinc-700 px-3 py-2 text-sm hover:bg-zinc-600 disabled:opacity-50"
      >
        {loading ? "Building…" : "Build rollups"}
      </button>
      {message && <span className="text-sm text-zinc-400">{message}</span>}
    </div>
  );
}
