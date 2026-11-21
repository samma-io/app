// Presentational pieces shared by the SIEM pages (server-safe: no hooks).

import { Badge } from "@/components/ui/badge";
import { cn, severityColor } from "@/lib/utils";
import { ALERT_LEVELS, type AlertCounts } from "@/data/mock-siem";
import { LATEST_RULESET, type RuleLevel } from "@/lib/siem-rules";
import { STATUS_LABEL, type SiemStatus } from "@/lib/siem";

const LEVEL_LABEL: Record<RuleLevel, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function DemoBadge({ label = "Demo data" }: { label?: string }) {
  return <Badge className="bg-amber-100 text-amber-800">{label}</Badge>;
}

export function LevelBadge({ level }: { level: RuleLevel }) {
  return (
    <span className={cn("inline-flex rounded px-2 py-0.5 text-xs font-semibold", severityColor(level))}>
      {LEVEL_LABEL[level]}
    </span>
  );
}

const STATUS_CLASS: Record<SiemStatus, string> = {
  deploying: "bg-blue-100 text-blue-800",
  running: "bg-green-100 text-green-800",
  waiting: "bg-gray-100 text-gray-700",
  down: "bg-red-100 text-red-800",
};

export function SiemStatusBadge({ status }: { status: SiemStatus }) {
  return <Badge className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</Badge>;
}

export function RulesetBadge({ version }: { version: string | null }) {
  if (!version) return <span className="text-gray-400">—</span>;
  const latest = version === LATEST_RULESET.version;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-gray-900">{version}</span>
      {latest ? (
        <Badge className="bg-green-100 text-green-800">Latest</Badge>
      ) : (
        <Badge className="bg-orange-100 text-orange-800">Update available</Badge>
      )}
    </span>
  );
}

/** Critical/High/Medium/Low alert counts for one window, plus a smaller second window. */
export function AlertTiles({
  primary,
  secondary,
  primaryLabel = "last 24 hours",
  secondaryLabel = "7 days",
}: {
  primary: AlertCounts;
  secondary?: AlertCounts;
  primaryLabel?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {ALERT_LEVELS.map((l) => (
        <div key={l} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{LEVEL_LABEL[l]}</span>
            <span className={cn("h-2.5 w-2.5 rounded-full", severityColor(l))} />
          </div>
          <p className={cn("mt-2 text-4xl font-bold", primary[l] > 0 ? "text-gray-900" : "text-gray-300")}>
            {primary[l]}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Alerts, {primaryLabel}
            {secondary && (
              <>
                {" · "}
                <span className="text-gray-600">{secondary[l]}</span> in {secondaryLabel}
              </>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
