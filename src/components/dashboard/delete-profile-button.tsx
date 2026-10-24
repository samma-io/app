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
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    startTransition(async () => {
      setError(null);
      try {
        await deleteProfile(profileId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete profile"
        );
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-1">
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
        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
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
