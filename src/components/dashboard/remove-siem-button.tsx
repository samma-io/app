"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { removeSiemInstance } from "@/app/dashboard/actions";

export function RemoveSiemButton({ siemId, siemName }: { siemId: string; siemName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Remove &ldquo;{siemName}&rdquo; from Samma?</span>
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await removeSiemInstance(siemId);
              router.push("/dashboard/siem");
            })
          }
          className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {isPending ? "Removing…" : "Yes, remove"}
        </button>
        <button
          disabled={isPending}
          onClick={() => setConfirming(false)}
          className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-red-600"
    >
      <Trash2 className="h-4 w-4" />
      Remove
    </button>
  );
}
