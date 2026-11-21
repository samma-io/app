"use client";

import { AlertCircle } from "lucide-react";
import { CopyButton } from "@/components/dashboard/copy-button";

/** A freshly created or rotated SIEM key, shown once, with where it goes. */
export function SiemKeyReveal({ siemKey, onDone }: { siemKey: string; onDone?: () => void }) {
  const values = `samma:\n  dashboard:\n    key: ${siemKey}`;
  return (
    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm font-medium text-amber-800">
          Copy this SIEM key now. It will not be shown again.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2">
        <code className="flex-1 break-all font-mono text-xs text-gray-800">{siemKey}</code>
        <CopyButton value={siemKey} />
      </div>
      <div>
        <p className="text-sm text-amber-900">
          Add it to the <code className="rounded bg-white px-1 text-xs">samma-siem</code> Helm values of
          your SIEM:
        </p>
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2">
          <pre className="flex-1 overflow-x-auto font-mono text-xs text-gray-800">{values}</pre>
          <CopyButton value={values} />
        </div>
        <p className="mt-2 text-xs text-amber-800">
          Coming soon: the SIEM does not report to the dashboard yet, so alerts and rulesets shown here
          are demo data.
        </p>
      </div>
      {onDone && (
        <button onClick={onDone} className="text-sm font-medium text-samma-navy hover:underline">
          Done
        </button>
      )}
    </div>
  );
}
