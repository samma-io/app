"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { SeverityBadge } from "@/components/dashboard/severity-tiles";

export type FindingRow = {
  key: string;
  time: string;
  severity?: string;
  title?: string;
  scanner: string;
  scannerLabel: string;
  targetId: string;
  target?: string;
  targetHref?: string;
  checkId?: string;
  endpoint?: { host?: string; port?: string | number; scheme?: string };
  evidence?: string;
  remediation?: string;
  references?: string[];
  cveIds?: string[];
  compliance?: string[];
};

function endpointText(e: FindingRow["endpoint"]): string | null {
  if (!e?.host) return null;
  return `${e.scheme ? `${e.scheme}://` : ""}${e.host}${e.port ? `:${e.port}` : ""}`;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-700 break-words">{children}</dd>
    </div>
  );
}

export function FindingsList({ rows }: { rows: FindingRow[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (rows.length === 0) {
    return <div className="px-6 py-10 text-center text-gray-400 text-sm">No findings match.</div>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {rows.map((f) => {
        const isOpen = !!open[f.key];
        const ep = endpointText(f.endpoint);
        return (
          <li key={f.key}>
            <button
              onClick={() => setOpen((p) => ({ ...p, [f.key]: !p[f.key] }))}
              className="flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-gray-50"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
              )}
              <SeverityBadge severity={f.severity} />
              <span className="flex-1 text-sm text-gray-900">{f.title ?? f.checkId ?? "Finding"}</span>
              <span className="hidden font-mono text-xs text-gray-500 md:inline">{f.target ?? "—"}</span>
              <span className="hidden text-xs text-gray-400 lg:inline w-40 truncate">{f.scannerLabel}</span>
              <span className="hidden text-xs text-gray-400 sm:inline w-36 text-right">{formatDate(f.time)}</span>
            </button>
            {isOpen && (
              <dl className="space-y-3 bg-gray-50 px-6 py-4 pl-[3.25rem]">
                <Detail label="Target">
                  {f.targetHref ? (
                    <Link href={f.targetHref} className="font-mono text-samma-navy hover:underline">
                      {f.target ?? f.targetId}
                    </Link>
                  ) : (
                    <span className="font-mono">{f.target ?? f.targetId}</span>
                  )}
                </Detail>
                {ep && <Detail label="Endpoint"><span className="font-mono">{ep}</span></Detail>}
                <Detail label="Scanner">{f.scannerLabel}</Detail>
                {f.checkId && <Detail label="Check"><span className="font-mono">{f.checkId}</span></Detail>}
                {f.evidence && (
                  <Detail label="Evidence">
                    <pre className="whitespace-pre-wrap rounded bg-white p-2 font-mono text-xs text-gray-700 border border-gray-200">
                      {f.evidence}
                    </pre>
                  </Detail>
                )}
                {f.remediation && <Detail label="Remediation">{f.remediation}</Detail>}
                {f.cveIds && f.cveIds.length > 0 && (
                  <Detail label="CVE">
                    <span className="flex flex-wrap gap-2">
                      {f.cveIds.map((c) => (
                        <a
                          key={c}
                          href={`https://nvd.nist.gov/vuln/detail/${encodeURIComponent(c)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-samma-navy hover:underline"
                        >
                          {c}
                        </a>
                      ))}
                    </span>
                  </Detail>
                )}
                {f.compliance && f.compliance.length > 0 && (
                  <Detail label="Compliance">{f.compliance.join(", ")}</Detail>
                )}
                {f.references && f.references.length > 0 && (
                  <Detail label="References">
                    <ul className="space-y-1">
                      {f.references.map((r) =>
                        /^https?:\/\//.test(r) ? (
                          <li key={r}>
                            <a href={r} target="_blank" rel="noreferrer" className="text-samma-navy hover:underline break-all">
                              {r}
                            </a>
                          </li>
                        ) : (
                          <li key={r}>{r}</li>
                        )
                      )}
                    </ul>
                  </Detail>
                )}
                <Detail label="Seen">{formatDate(f.time)}</Detail>
              </dl>
            )}
          </li>
        );
      })}
    </ul>
  );
}
