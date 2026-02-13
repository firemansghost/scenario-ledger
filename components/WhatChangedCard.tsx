import Link from "next/link";

interface WhatChangedCardProps {
  bullets: string[];
  shareMode?: boolean;
}

export function WhatChangedCard({ bullets, shareMode = false }: WhatChangedCardProps) {
  if (bullets.length === 0) return null;

  const href = shareMode ? "/predictions?share=1#tripwires" : "/predictions#tripwires";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="mb-2 text-base font-medium">What changed since last week</h2>
      <ul className="mb-3 list-disc space-y-1 pl-4 text-sm text-zinc-400">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      <Link href={href} className="text-xs text-zinc-500 underline hover:text-zinc-300">
        See tripwire status →
      </Link>
    </div>
  );
}
