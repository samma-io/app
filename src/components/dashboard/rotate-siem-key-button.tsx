"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { rotateSiemKey } from "@/app/dashboard/actions";
import { SiemKeyReveal } from "@/components/dashboard/siem-key-reveal";

export function RotateSiemKeyButton({ siemId }: { siemId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [key, setKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (key) return <SiemKeyReveal siemKey={key} onDone={() => setKey(null)} />;

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-600">The current key stops working. Rotate?</span>
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              try {
                const res = await rotateSiemKey(siemId);
                setKey(res.key);
                setConfirming(false);
              } catch {
                setError("Could not rotate the key. Please try again.");
              }
            })
          }
          className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {isPending ? "Rotating…" : "Yes, rotate"}
        </button>
        <button
          disabled={isPending}
          onClick={() => setConfirming(false)}
          className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          Cancel
        </button>
        {error && <span className="text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-samma-navy"
    >
      <RefreshCw className="h-4 w-4" />
      Rotate key
    </button>
  );
}
