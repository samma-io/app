"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setActiveOrgAction } from "@/app/dashboard/actions";
import type { Organisation } from "@prisma/client";

interface OrgPickerClientProps {
  orgs: Organisation[];
}

export function OrgPickerClient({ orgs }: OrgPickerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(orgId: string) {
    startTransition(async () => {
      await setActiveOrgAction(orgId);
      router.refresh();
    });
  }

  return (
    <ul className="space-y-2 w-full max-w-xs mx-auto">
      {orgs.map((org) => (
        <li key={org.id}>
          <button
            onClick={() => handleSelect(org.id)}
            disabled={isPending}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-samma-navy transition-colors text-sm font-medium text-gray-900 disabled:opacity-60"
          >
            {org.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
