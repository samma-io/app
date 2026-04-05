"use client";

import { useRef, useState, useTransition } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addTarget } from "@/app/dashboard/actions";

interface AddTargetFormProps {
  profileId: string;
}

export function AddTargetForm({ profileId }: AddTargetFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLInputElement>(null);
  const portRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<"ip" | "dns">("ip");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = valueRef.current?.value.trim();
    if (!value) return;

    const portRaw = portRef.current?.value.trim();
    const port = portRaw ? Number(portRaw) : undefined;

    setError(null);
    startTransition(async () => {
      try {
        await addTarget(profileId, value, type, labelRef.current?.value.trim(), port);
        setOpen(false);
        if (valueRef.current) valueRef.current.value = "";
        if (labelRef.current) labelRef.current.value = "";
        if (portRef.current) portRef.current.value = "";
      } catch {
        setError("Failed to add target. Please try again.");
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
        Add Target
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3"
    >
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "ip" | "dns")}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-samma-navy"
            disabled={isPending}
          >
            <option value="ip">IP Address</option>
            <option value="dns">DNS Name</option>
          </select>
        </div>
        <input
          ref={valueRef}
          autoFocus
          placeholder={type === "ip" ? "e.g. 192.168.1.1" : "e.g. example.com"}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-samma-navy min-w-[160px]"
          disabled={isPending}
        />
        <input
          ref={portRef}
          type="number"
          min={1}
          max={65535}
          placeholder="Port (optional)"
          className="w-36 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-samma-navy"
          disabled={isPending}
        />
        <input
          ref={labelRef}
          placeholder="Label (optional)"
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-samma-navy min-w-[140px]"
          disabled={isPending}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={isPending}>
          {isPending ? "Adding…" : "Add Target"}
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
      </div>
    </form>
  );
}
