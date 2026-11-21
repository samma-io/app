import type { ExternalScanStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { formatExternalResult } from "@/lib/external-scans";
import { RescanExternalButton } from "@/components/dashboard/rescan-external-button";

export type ExternalScanRunView = {
  id: string;
  connectionName: string;
  status: ExternalScanStatus;
  trigger: string;
  requestedAt: Date;
  finishedAt: Date | null;
  result: unknown;
  findingCount: number;
  error: string | null;
};

interface ExternalScanResultsProps {
  targetId: string;
  scanners: { connectionId: string; name: string }[];
  runs: ExternalScanRunView[];
  canScan: boolean;
}

const STATUS_CLASS: Record<ExternalScanStatus, string> = {
  RUNNING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

const SEVERITY_CLASS: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-blue-100 text-blue-800",
};

export function ExternalScanResults({ targetId, scanners, runs, canScan }: ExternalScanResultsProps) {
  return (
    <div className="space-y-4">
      {scanners.length > 0 && canScan && (
        <div className="flex flex-wrap items-center gap-3 px-6 pt-4">
          {scanners.map((s) => (
            <span key={s.connectionId} className="inline-flex items-center gap-2 text-sm text-gray-700">
              {s.name}
              <RescanExternalButton targetId={targetId} connectionId={s.connectionId} connectionName={s.name} />
            </span>
          ))}
        </div>
      )}

      {runs.length === 0 ? (
        <p className="px-6 py-6 text-sm text-gray-500">
          {scanners.length === 0
            ? "No external scanner is enabled on this target's profile."
            : "No external scans yet."}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {runs.map((run) => {
            const formatted = run.status === "COMPLETED" || run.result ? formatExternalResult(run.result) : null;
            return (
              <li key={run.id} className="px-6 py-4 space-y-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-medium text-gray-900">{run.connectionName}</span>
                  <Badge className={STATUS_CLASS[run.status]}>{run.status.toLowerCase()}</Badge>
                  <span className="text-gray-500">
                    {run.trigger === "rescan" ? "Rescan" : "New target"} · requested {formatDate(run.requestedAt.toISOString())}
                    {run.finishedAt && <> · finished {formatDate(run.finishedAt.toISOString())}</>}
                  </span>
                  {run.status === "COMPLETED" && (
                    <span className="text-gray-500">
                      {run.findingCount} {run.findingCount === 1 ? "finding" : "findings"}
                    </span>
                  )}
                </div>
                {run.status === "RUNNING" && (
                  <p className="text-xs text-gray-500">Scanning. Reload the page to fetch the result.</p>
                )}
                {run.error && <p className="text-sm text-red-700">{run.error}</p>}
                {formatted && "findings" in formatted && formatted.findings.length > 0 && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400">
                        <th className="py-1 pr-4 font-normal">Severity</th>
                        <th className="py-1 pr-4 font-normal">Finding</th>
                        <th className="py-1 font-normal">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formatted.findings.map((f, i) => (
                        <tr key={i} className="align-top">
                          <td className="py-1 pr-4">
                            <Badge className={SEVERITY_CLASS[f.severity.toLowerCase()] ?? "bg-gray-100 text-gray-600"}>
                              {f.severity}
                            </Badge>
                          </td>
                          <td className="py-1 pr-4 text-gray-900">{f.title}</td>
                          <td className="py-1 text-gray-600 break-all">{f.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {formatted && "raw" in formatted && (
                  <pre className="max-h-80 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-700">{formatted.raw}</pre>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
