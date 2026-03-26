import { useMemo, useState } from "react";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import Button from "./Button";

export default function AuditLogList({ logs }) {
  const [showAll, setShowAll] = useState(false);

  const hasMoreThanThree = logs.length > 3;

  const visibleLogs = useMemo(() => {
    if (showAll) return logs;
    return logs.slice(0, 3);
  }, [logs, showAll]);

  return (
    <div className="panel p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyanGlow/70">Audit trail</p>
          <h3 className="mt-2 text-xl font-bold text-white">Recent activity</h3>
        </div>
        <div className="rounded-2xl bg-cyanGlow/10 p-3 text-cyanGlow">
          <Activity size={18} />
        </div>
      </div>

      <div className="space-y-3">
        {visibleLogs.length ? (
          visibleLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">{log.action}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {log.details || "Security event recorded"}
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-sm text-slate-400">
            Audit logs will appear here after registration, login, vault actions, and logout events.
          </div>
        )}
      </div>

      {hasMoreThanThree && (
        <div className="mt-4">
          <Button
            variant="dark"
            onClick={() => setShowAll((prev) => !prev)}
            className="w-full"
          >
            {showAll ? (
              <>
                <ChevronUp className="mr-2" size={16} />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="mr-2" size={16} />
                View more
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}