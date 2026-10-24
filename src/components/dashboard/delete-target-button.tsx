"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTarget } from "@/app/dashboard/actions";

interface DeleteTargetButtonProps {
  targetId: string;
  profileId: string;
}

export function DeleteTargetButton({
  targetId,
  profileId,
}: DeleteTargetButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await deleteTarget(targetId, profileId);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Failed to delete target"
              );
            }
          })
        }
        disabled={isPending}
        className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
        title="Delete target"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
