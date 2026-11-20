"use client";

import { useState, useTransition } from "react";
import { setProfileExternalScanner } from "@/app/dashboard/actions";
import { formatPrice } from "@/lib/external-scanners";

interface Connection {
  id: string;
  name: string;
  pricePerScanCents: number;
  currency: string;
  enabled: boolean;
}

export function ProfileExternalScanners({
  profileId,
  targetCount,
  connections,
}: {
  profileId: string;
  targetCount: number;
  connections: Connection[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(connectionId: string, enabled: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await setProfileExternalScanner(profileId, connectionId, enabled);
      } catch {
        setError("Failed to update. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <ul className="divide-y divide-gray-50">
        {connections.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2">
            <label className="flex items-center gap-2 text-sm text-gray-900">
              <input
                type="checkbox"
                checked={c.enabled}
                disabled={isPending}
                onChange={(e) => toggle(c.id, e.target.checked)}
              />
              {c.name}
            </label>
            <span className="text-sm text-gray-500">
              {formatPrice(c.pricePerScanCents, c.currency)} × {targetCount}{" "}
              {targetCount === 1 ? "target" : "targets"} ={" "}
              <strong className="text-gray-900">
                {formatPrice(c.pricePerScanCents * targetCount, c.currency)}
              </strong>{" "}
              per run
            </span>
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
