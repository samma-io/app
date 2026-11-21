import Link from "next/link";
import { cn, severityColor } from "@/lib/utils";
import { SEVERITIES } from "@/lib/severity";

const LABEL: Record<string, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  INFO: "Info",
};

export function severityLabel(s: string | undefined): string {
  return LABEL[(s ?? "").toUpperCase()] ?? "Unknown";
}

export function SeverityBadge({ severity }: { severity?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold",
        severityColor((severity ?? "").toLowerCase())
      )}
    >
      {severityLabel(severity)}
    </span>
  );
}

/** Critical/High/Medium as large tiles, Low/Info small. Each links to the findings list. */
export function SeverityTiles({
  counts,
  hrefFor,
}: {
  counts: Record<string, number>;
  hrefFor: (severity: string) => string;
}) {
  const [big, small] = [SEVERITIES.slice(0, 3), SEVERITIES.slice(3)];
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,0.8fr)]">
      {big.map((s) => (
        <Link
          key={s}
          href={hrefFor(s)}
          className="group rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:border-gray-300 hover:shadow transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{LABEL[s]}</span>
            <span className={cn("h-2.5 w-2.5 rounded-full", severityColor(s.toLowerCase()))} />
          </div>
          <p
            className={cn(
              "mt-2 text-4xl font-bold",
              counts[s] > 0 ? "text-gray-900" : "text-gray-300"
            )}
          >
            {counts[s] ?? 0}
          </p>
          <p className="mt-1 text-xs text-gray-400 group-hover:text-samma-navy">View findings →</p>
        </Link>
      ))}
      <div className="grid grid-cols-2 gap-4 sm:col-span-3 lg:col-span-1 lg:grid-cols-1">
        {small.map((s) => (
          <Link
            key={s}
            href={hrefFor(s)}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:border-gray-300"
          >
            <span className="text-sm text-gray-500">{LABEL[s]}</span>
            <span className="text-lg font-semibold text-gray-700">{counts[s] ?? 0}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Small count chips for Critical/High/Medium/Low (zeros dimmed). */
export function SeverityChips({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="flex gap-1">
      {SEVERITIES.slice(0, 4).map((s) => (
        <span
          key={s}
          title={LABEL[s]}
          className={cn(
            "min-w-7 rounded px-1.5 py-0.5 text-center text-xs font-semibold",
            counts[s] > 0 ? severityColor(s.toLowerCase()) : "bg-gray-100 text-gray-400"
          )}
        >
          {counts[s] ?? 0}
        </span>
      ))}
    </div>
  );
}
