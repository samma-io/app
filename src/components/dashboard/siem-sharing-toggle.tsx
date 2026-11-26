"use client";

import { useState, useTransition } from "react";
import { setSiemSharing } from "@/app/dashboard/actions";

export function SiemSharingToggle({ siemId, on, canChange }: { siemId: string; on: boolean; canChange: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = (next: boolean) =>
    startTransition(async () => {
      try {
        const res = await setSiemSharing(siemId, next);
        setError(res.error ?? null);
        setConfirming(false);
      } catch {
        setError("Could not change sharing. Please try again.");
      }
    });

  if (!canChange) {
    return <p className="text-sm text-gray-500">Only an owner of the organisation can change this.</p>;
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-600">Stop sharing and delete what this SIEM has shared?</span>
        <button
          disabled={isPending}
          onClick={() => apply(false)}
          className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {isPending ? "Stopping…" : "Yes, stop"}
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
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <button
        disabled={isPending}
        onClick={() => (on ? setConfirming(true) : apply(true))}
        className={
          on
            ? "rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            : "rounded-md bg-samma-navy px-3 py-1.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
        }
      >
        {isPending ? "Saving…" : on ? "Stop sharing" : "Share attacker IPs"}
      </button>
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
