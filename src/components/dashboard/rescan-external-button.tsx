"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { rescanExternal } from "@/app/dashboard/actions";

interface RescanExternalButtonProps {
  targetId: string;
  connectionId: string;
  connectionName: string;
}

export function RescanExternalButton({ targetId, connectionId, connectionName }: RescanExternalButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRescan() {
    setError(null);
    startTransition(async () => {
      try {
        await rescanExternal(targetId, connectionId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Rescan failed");
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={handleRescan}
        disabled={isPending}
        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        title={`Scan this target again with ${connectionName}`}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Starting…" : "Rescan"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
