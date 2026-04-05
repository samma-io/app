"use client";

import { useRef, useState, useTransition } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createProfile } from "@/app/dashboard/actions";
import type { ProfileType } from "@prisma/client";

export function CreateProfileForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<ProfileType>("SMALL");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = inputRef.current?.value.trim();
    if (!name) return;

    setError(null);
    startTransition(async () => {
      try {
        await createProfile(name, type);
        setOpen(false);
        if (inputRef.current) inputRef.current.value = "";
      } catch {
        setError("Failed to create profile. Please try again.");
      }
    });
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
        New Profile
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-wrap">
      <input
        ref={inputRef}
        autoFocus
        placeholder="Profile name (e.g. PCI DSS)"
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-samma-navy min-w-[220px]"
        disabled={isPending}
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as ProfileType)}
        className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-samma-navy"
        disabled={isPending}
      >
        <option value="SMALL">Quick scan</option>
        <option value="FULL">Deep scan</option>
      </select>
      <Button type="submit" variant="primary" size="sm" disabled={isPending}>
        {isPending ? "Creating…" : "Create"}
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
