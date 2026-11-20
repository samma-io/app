"use client";

import { useRef, useState, useTransition } from "react";
import { PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { connectExternalScanner } from "@/app/dashboard/actions";
import { EXTERNAL_SCANNERS, formatPrice } from "@/lib/external-scanners";

const inputClass =
  "px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-samma-navy";

export function ConnectExternalScannerForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [scannerId, setScannerId] = useState<string>(EXTERNAL_SCANNERS[0].id);
  const nameRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);

  const scanner = EXTERNAL_SCANNERS.find((s) => s.id === scannerId) ?? EXTERNAL_SCANNERS[0];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const apiKey = keyRef.current?.value ?? "";
    if (!apiKey.trim()) {
      setError("API key is required");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await connectExternalScanner({
          scannerId,
          name: nameRef.current?.value ?? "",
          apiKey,
        });
        if (res.error) {
          setError(res.error);
          return;
        }
        setOpen(false);
      } catch {
        setError("Failed to connect scanner. Please try again.");
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
        <PlugZap className="h-4 w-4" />
        Connect scanner
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-xl">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-gray-700">Scanner</span>
          <select
            value={scannerId}
            onChange={(e) => setScannerId(e.target.value)}
            className={`${inputClass} w-full bg-white`}
            disabled={isPending}
          >
            {EXTERNAL_SCANNERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-gray-700">Name</span>
          <input
            ref={nameRef}
            placeholder={scanner.label}
            className={`${inputClass} w-full`}
            disabled={isPending}
          />
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-gray-700">{scanner.vendor} API key</span>
        <input
          ref={keyRef}
          type="password"
          autoComplete="off"
          placeholder={scanner.apiKeyHint}
          className={`${inputClass} w-full font-mono`}
          disabled={isPending}
        />
      </label>
      <p className="text-xs text-gray-500">
        {scanner.description} Costs{" "}
        <strong>{formatPrice(scanner.pricePerScanCents, scanner.currency)} per scan, per target</strong>.
        The key is stored encrypted and is not shown again.
      </p>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={isPending}>
          {isPending ? "Connecting…" : "Connect"}
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
