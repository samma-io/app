"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createOrganisation } from "@/app/dashboard/actions";

export function CreateOrgForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = inputRef.current?.value.trim();
    if (!name) return;

    setError(null);
    startTransition(async () => {
      try {
        await createOrganisation(name);
        router.push("/dashboard");
      } catch {
        setError("Failed to create organization. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="org-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Organization name
        </label>
        <input
          id="org-name"
          ref={inputRef}
          autoFocus
          required
          placeholder="e.g. Acme Corp"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-samma-navy"
          disabled={isPending}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? "Creating…" : "Create organization"}
      </Button>
    </form>
  );
}
