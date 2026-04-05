"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { revokeToken } from "@/app/dashboard/actions";

interface RevokeTokenButtonProps {
  tokenId: string;
  tokenName: string;
}

export function RevokeTokenButton({
  tokenId,
  tokenName,
}: RevokeTokenButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleRevoke() {
    startTransition(async () => {
      await revokeToken(tokenId);
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Revoke &ldquo;{tokenName}&rdquo;?</span>
        <button
          onClick={handleRevoke}
          disabled={isPending}
          className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {isPending ? "Revoking…" : "Yes, revoke"}
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
      title="Revoke token"
    >
      <Trash2 className="h-4 w-4" />
      Revoke
    </button>
  );
}
