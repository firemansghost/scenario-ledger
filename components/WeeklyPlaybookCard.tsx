"use client";

import Link from "next/link";
import { CheckoffHeader, usePlaybookCheckoff } from "@/components/PlaybookCheckoff";
import type { PlaybookItem, WeeklyPlaybook } from "@/lib/playbook";

const statusStyles: Record<PlaybookItem["status"], string> = {
  confirming: "bg-emerald-900/50 text-emerald-300",
  watching: "bg-amber-900/50 text-amber-300",
  risk: "bg-rose-900/50 text-rose-300",
  unknown: "bg-zinc-700/50 text-zinc-500",
};

const statusLabels: Record<PlaybookItem["status"], string> = {
  confirming: "Confirming",
  watching: "Watching",
  risk: "Risk",
  unknown: "Unknown",
};

interface WeeklyPlaybookCardProps {
  playbook: WeeklyPlaybook;
  weekEnding: string;
  shareMode?: boolean;
  nerdMode?: boolean;
  links: {
    forecastBrief: string;
    tripwiresAnchor: string;
    alignment: string;
    evidence: string;
    briefsWeek: string;
  };
}

function ItemRow({
  item,
  showCheckbox,
  isChecked,
  onToggle,
}: {
  item: PlaybookItem;
  showCheckbox: boolean;
  isChecked: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="space-y-0.5">
      <div className="flex items-start gap-2">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={isChecked}
            onChange={onToggle}
            className="mt-1 h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-zinc-700/50 px-1 py-0.5 text-xs text-zinc-400">
              {item.kind === "checkpoint" ? "Checkpoint" : "Invalidation"}
            </span>
            <span
              className={`rounded px-1 py-0.5 text-xs font-medium ${statusStyles[item.status]}`}
            >
              {statusLabels[item.status]}
            </span>
          </div>
          <p className="truncate text-sm text-zinc-300" title={item.text}>
            {item.text}
          </p>
          {item.reason && (
            <p className="text-xs text-zinc-500">{item.reason}</p>
          )}
        </div>
      </div>
    </li>
  );
}

function SectionColumn({
  title,
  items,
  checkoff,
  shareMode,
}: {
  title: string;
  items: PlaybookItem[];
  checkoff: ReturnType<typeof usePlaybookCheckoff>;
  shareMode: boolean;
}) {
  const showCheckbox = !shareMode && items.some((i) => i.status === "watching" || i.status === "risk");
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-zinc-500">
        {title} <span className="rounded bg-zinc-700/50 px-1 py-0.5">{items.length}</span>
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <ItemRow
            key={item.key}
            item={item}
            showCheckbox={showCheckbox && (item.status === "watching" || item.status === "risk")}
            isChecked={checkoff.isChecked(item.key)}
            onToggle={() => checkoff.toggle(item.key)}
          />
        ))}
      </ul>
    </div>
  );
}

export function WeeklyPlaybookCard({
  playbook,
  weekEnding,
  shareMode = false,
  nerdMode = false,
  links,
}: WeeklyPlaybookCardProps) {
  const checkableKeys = [
    ...playbook.sections.watching,
    ...playbook.sections.risk,
  ].map((i) => i.key);
  const checkoff = usePlaybookCheckoff(weekEnding, checkableKeys, shareMode);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-lg font-medium">{playbook.title}</h2>
      <p className="mb-2 text-sm text-zinc-500">{playbook.subtitle}</p>
      <p className="mb-4 font-medium text-zinc-200">{playbook.headline}</p>

      {!shareMode && checkableKeys.length > 0 && (
        <CheckoffHeader
          checkedCount={checkoff.checkedCount}
          total={checkoff.total}
          onReset={checkoff.reset}
          nerdMode={nerdMode}
        />
      )}

      <div className="mb-4 grid gap-6 md:grid-cols-3">
        <SectionColumn
          title="Confirming"
          items={playbook.sections.confirming}
          checkoff={checkoff}
          shareMode={shareMode}
        />
        <SectionColumn
          title="Watching"
          items={playbook.sections.watching}
          checkoff={checkoff}
          shareMode={shareMode}
        />
        <SectionColumn
          title="Risk"
          items={playbook.sections.risk}
          checkoff={checkoff}
          shareMode={shareMode}
        />
      </div>

      {playbook.sections.unknown.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-zinc-500">Unknown</p>
          <ul className="space-y-1">
            {playbook.sections.unknown.map((item) => (
              <ItemRow
                key={item.key}
                item={item}
                showCheckbox={false}
                isChecked={false}
                onToggle={() => {}}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4">
        <p className="mb-2 text-xs font-medium text-zinc-500">
          Flip triggers (heuristic):
        </p>
        <ul className="list-disc space-y-0.5 pl-4 text-sm text-zinc-400">
          {playbook.flipTriggers.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-medium text-zinc-500">
          Quick check next week:
        </p>
        <ul className="list-disc space-y-0.5 pl-4 text-sm text-zinc-400">
          {playbook.checkNextWeek.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      <div className="mb-4 space-y-0.5 text-xs text-zinc-500">
        {playbook.disclaimers.map((d, i) => (
          <p key={i}>{d}</p>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={links.forecastBrief}
          className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          Open Forecast Brief
        </Link>
        <Link
          href={links.alignment}
          className="inline-flex items-center justify-center rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 focus:outline-none"
        >
          See alignment
        </Link>
        <Link
          href={links.evidence}
          className="inline-flex items-center justify-center rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 focus:outline-none"
        >
          Open evidence
        </Link>
        <Link
          href={links.briefsWeek}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          Open this week&apos;s brief →
        </Link>
      </div>
    </div>
  );
}
