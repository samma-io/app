"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { removeExternalScanner } from "@/app/dashboard/actions";

interface RemoveExternalScannerButtonProps {
  connectionId: string;
  connectionName: string;
}

export function RemoveExternalScannerButton({ connectionId, connectionName }: RemoveExternalScannerButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleRemove() {
    startTransition(async () => {
      await removeExternalScanner(connectionId);
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-gray-600">Remove &ldquo;{connectionName}&rdquo;?</span>
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {isPending ? "Removing…" : "Yes, remove"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-red-600 transition-colors"
      title="Remove external scanner"
    >
      <Trash2 className="h-4 w-4" />
      Remove
    </button>
  );
}
