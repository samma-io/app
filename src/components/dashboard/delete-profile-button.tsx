"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProfile } from "@/app/dashboard/actions";

interface DeleteProfileButtonProps {
  profileId: string;
  profileName: string;
}

export function DeleteProfileButton({
  profileId,
  profileName,
}: DeleteProfileButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      await deleteProfile(profileId);
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Delete &ldquo;{profileName}&rdquo;?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-gray-300 hover:text-red-500 transition-colors"
      title="Delete profile"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
