"use client";

import { useTransition } from "react";
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

  return (
    <button
      onClick={() =>
        startTransition(() => deleteTarget(targetId, profileId))
      }
      disabled={isPending}
      className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
      title="Delete target"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
