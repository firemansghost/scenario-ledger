import Link from "next/link";

export function ShareBlockedView() {
  return (
    <div className="space-y-4 rounded-lg border border-amber-800/50 bg-amber-950/20 p-6 text-center">
      <h2 className="text-lg font-medium text-amber-200">Not available in share view</h2>
      <p className="text-sm text-zinc-400">
        This page is hidden when sharing. Remove <code className="rounded bg-zinc-800 px-1">?share=1</code> from the URL to access advanced details (after enabling Nerd Mode).
      </p>
      <Link href="/" className="inline-block text-sm text-zinc-400 underline hover:text-white">
        Back to Dashboard
      </Link>
    </div>
  );
}
