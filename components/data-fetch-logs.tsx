interface Log {
  id: string;
  job: string;
  source: string;
  series_key: string | null;
  status: string;
  message: string | null;
  created_at: string;
}

interface DataFetchLogsProps {
  logs: Log[];
}

export function DataFetchLogs({ logs }: DataFetchLogsProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-700 bg-zinc-900/50">
            <th className="p-2 font-medium">Job</th>
            <th className="p-2 font-medium">Source</th>
            <th className="p-2 font-medium">Series</th>
            <th className="p-2 font-medium">Status</th>
            <th className="p-2 font-medium">Message</th>
            <th className="p-2 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-zinc-800">
              <td className="p-2">{log.job}</td>
              <td className="p-2">{log.source}</td>
              <td className="p-2 font-mono text-zinc-400">{log.series_key ?? "—"}</td>
              <td className="p-2">
                <span
                  className={
                    log.status === "success" ? "text-emerald-400" : "text-rose-400"
                  }
                >
                  {log.status}
                </span>
              </td>
              <td className="max-w-xs truncate p-2 text-zinc-500">{log.message ?? "—"}</td>
              <td className="p-2 text-xs text-zinc-500">
                {new Date(log.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && (
        <p className="p-4 text-sm text-zinc-500">No logs yet.</p>
      )}
    </div>
  );
}
