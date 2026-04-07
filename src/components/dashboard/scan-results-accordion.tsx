"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export interface ScanResult {
  time: string; // ISO string
  host: string | null;
  port: string | null;
  status: string | null;
  type: string | null;
  scanner: string;
  tags: string | null;
  raw: unknown;
}

interface Props {
  grouped: Record<string, ScanResult[]>;
  scanners: string[];
}

function statusBadgeClass(status: string | null): string {
  if (status === "open") return "bg-green-100 text-green-800";
  if (status === "closed") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-700";
}

export function ScanResultsAccordion({ grouped, scanners }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [rawOpen, setRawOpen] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleRaw = (key: string) =>
    setRawOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  if (scanners.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400 text-sm">
        No scan results yet for this target.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {scanners.map((scanner) => {
        const rows = grouped[scanner];
        const isOpen = !!open[scanner];
        const latest = rows[0]?.time;

        return (
          <div key={scanner}>
            {/* Scanner group header */}
            <button
              onClick={() => toggle(scanner)}
              className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
              )}
              <span className="font-mono text-sm font-semibold text-gray-900 flex-1">
                {scanner}
              </span>
              <span className="text-sm text-gray-400">
                {rows.length} {rows.length === 1 ? "result" : "results"}
              </span>
              {latest && (
                <span className="text-xs text-gray-400 ml-4">
                  Last: {formatDate(latest)}
                </span>
              )}
            </button>

            {/* Expanded table */}
            {isOpen && (
              <div className="border-t border-gray-50 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Time</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Host</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Type</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Port</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Tags</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Raw</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.map((row, i) => {
                      const rowKey = `${scanner}-${i}`;
                      return (
                        <>
                          <tr key={rowKey} className="hover:bg-gray-50 align-top">
                            <td className="px-4 py-2 text-gray-400 whitespace-nowrap">
                              {formatDate(row.time)}
                            </td>
                            <td className="px-4 py-2 font-mono text-gray-700">{row.host ?? "—"}</td>
                            <td className="px-4 py-2 text-gray-700">{row.type ?? "—"}</td>
                            <td className="px-4 py-2 font-mono text-gray-700">{row.port || "—"}</td>
                            <td className="px-4 py-2">
                              {row.status ? (
                                <Badge className={statusBadgeClass(row.status)}>
                                  {row.status}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-gray-500 font-mono max-w-xs truncate">
                              {row.tags ?? "—"}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => toggleRaw(rowKey)}
                                className="text-xs text-blue-500 hover:underline"
                              >
                                {rawOpen[rowKey] ? "hide" : "show"}
                              </button>
                            </td>
                          </tr>
                          {rawOpen[rowKey] && (
                            <tr key={`${rowKey}-raw`}>
                              <td colSpan={7} className="px-4 pb-3">
                                <pre className="bg-gray-900 text-gray-100 rounded p-3 text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                                  {JSON.stringify(row.raw, null, 2)}
                                </pre>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
