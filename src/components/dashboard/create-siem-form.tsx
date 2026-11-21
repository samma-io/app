"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Cloud, Plug, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSiemInstance } from "@/app/dashboard/actions";
import { SiemKeyReveal } from "@/components/dashboard/siem-key-reveal";

type Hosting = "ANKRA_SAMMA" | "ANKRA_OWN" | "CONNECTED";

export interface ProviderOption {
  id: string;
  label: string;
  regions: readonly string[];
}

const OPTIONS: { id: Hosting; title: string; body: string; icon: typeof Cloud }[] = [
  {
    id: "ANKRA_SAMMA",
    title: "Deploy with Ankra",
    body: "A managed SIEM on hosting Samma supports. Ankra runs the Kubernetes, we keep the rules current.",
    icon: Cloud,
  },
  {
    id: "ANKRA_OWN",
    title: "Ankra on your hosting",
    body: "Ankra deploys the SIEM into the cloud account or cluster you choose. Your logs stay in your account.",
    icon: Server,
  },
  {
    id: "CONNECTED",
    title: "Connect a running SIEM",
    body: "You already run samma-siem. Get a key to add to it, so it shows up here with its alerts and ruleset.",
    icon: Plug,
  },
];

const input =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-samma-navy";

export function CreateSiemForm({ providers }: { providers: ProviderOption[] }) {
  const [hosting, setHosting] = useState<Hosting>("ANKRA_SAMMA");
  const [name, setName] = useState("");
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [region, setRegion] = useState(providers[0]?.regions[0] ?? "");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; key: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const provider = providers.find((p) => p.id === providerId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await createSiemInstance({ name, hosting, provider: providerId, region });
        if (res.error) setError(res.error);
        else if (res.id && res.key) setCreated({ id: res.id, key: res.key });
      } catch {
        setError("Could not create the SIEM. Please try again.");
      }
    });
  }

  if (created) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          {hosting === "CONNECTED"
            ? `“${name}” is registered. Add the key below to your SIEM.`
            : `Ankra is deploying “${name}”. This takes a few minutes.`}
        </p>
        <SiemKeyReveal siemKey={created.key} />
        <Link
          href={`/dashboard/siem/${created.id}`}
          className="inline-block text-sm font-medium text-samma-navy hover:underline"
        >
          Go to {name} →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {OPTIONS.map(({ id, title, body, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setHosting(id)}
            className={cn(
              "rounded-lg border-2 bg-white p-5 text-left transition",
              hosting === id ? "border-samma-navy shadow" : "border-gray-200 hover:border-gray-300"
            )}
          >
            <Icon className="h-6 w-6 text-samma-navy" />
            <p className="mt-3 font-semibold text-gray-900">{title}</p>
            <p className="mt-1 text-sm text-gray-500">{body}</p>
          </button>
        ))}
      </div>

      <div className="grid max-w-xl gap-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Name</span>
          <input
            className={cn(input, "mt-1")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. production"
            maxLength={64}
            required
            disabled={isPending}
          />
        </label>

        {hosting === "ANKRA_OWN" && (
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Hosting</span>
              <select
                className={cn(input, "mt-1")}
                value={providerId}
                onChange={(e) => {
                  setProviderId(e.target.value);
                  setRegion(providers.find((p) => p.id === e.target.value)?.regions[0] ?? "");
                }}
                disabled={isPending}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Region</span>
              <select
                className={cn(input, "mt-1")}
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                disabled={isPending}
              >
                {provider?.regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={isPending || !name.trim()}>
            {isPending
              ? "Creating…"
              : hosting === "CONNECTED"
                ? "Connect and get key"
                : "Deploy with Ankra"}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </form>
  );
}
