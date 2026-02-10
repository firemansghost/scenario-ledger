import Link from "next/link";

export function NerdGateView() {
  return (
    <div className="space-y-4 rounded-lg border border-zinc-700 bg-zinc-900/50 p-6 text-center">
      <h2 className="text-lg font-medium text-zinc-200">Advanced details are off</h2>
      <p className="text-sm text-zinc-400">
        Go back to the Dashboard and click &ldquo;Advanced Details (Nerd Mode)&rdquo; to enable run history and admin tools.
      </p>
      <Link href="/" className="inline-block text-sm text-zinc-400 underline hover:text-white">
        Back to Dashboard
      </Link>
    </div>
  );
}
