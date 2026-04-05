"use client";

import { useRef, useState, useTransition } from "react";
import { PlusCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/dashboard/copy-button";
import { createToken } from "@/app/dashboard/actions";

export function CreateTokenForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rawToken, setRawToken] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = inputRef.current?.value.trim();
    if (!name) return;

    setError(null);
    startTransition(async () => {
      try {
        const { raw } = await createToken(name);
        setRawToken(raw);
        setOpen(false);
      } catch {
        setError("Failed to create token. Please try again.");
      }
    });
  }

  if (rawToken) {
    return (
      <div className="p-4 border border-amber-200 rounded-lg bg-amber-50 space-y-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm font-medium text-amber-800">
            Copy this token now — it will not be shown again.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-amber-300 rounded-lg px-3 py-2">
          <code className="flex-1 text-xs font-mono text-gray-800 break-all">
            {rawToken}
          </code>
          <CopyButton value={rawToken} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRawToken(null)}
        >
          Done
        </Button>
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <PlusCircle className="h-4 w-4" />
        New Token
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        ref={inputRef}
        autoFocus
        placeholder="Token name (e.g. CI pipeline)"
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-samma-navy min-w-[240px]"
        disabled={isPending}
      />
      <Button type="submit" variant="primary" size="sm" disabled={isPending}>
        {isPending ? "Generating…" : "Generate"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(false)}
        disabled={isPending}
      >
        Cancel
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
