"use client";

import { useTransition } from "react";
import { Play, PauseCircle } from "lucide-react";
import type { ScannerStatus } from "@prisma/client";
import { deployTarget, undeployTarget } from "@/app/dashboard/actions";

interface Props {
  targetId: string;
  profileId: string;
  scannerStatus: ScannerStatus;
}

export function TargetScannerButtons({ targetId, profileId, scannerStatus }: Props) {
  const [deployPending, startDeploy] = useTransition();
  const [undeployPending, startUndeploy] = useTransition();

  return (
    <div className="flex items-center gap-1">
      <button
        title="Deploy scanners"
        disabled={scannerStatus === "DEPLOYED" || deployPending || undeployPending}
        onClick={() => startDeploy(() => deployTarget(targetId, profileId))}
        className="p-1 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Play className="h-4 w-4" />
      </button>
      <button
        title="Remove scanners"
        disabled={scannerStatus === "READY_TO_DEPLOY" || deployPending || undeployPending}
        onClick={() => startUndeploy(() => undeployTarget(targetId, profileId))}
        className="p-1 rounded text-gray-400 hover:text-orange-500 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <PauseCircle className="h-4 w-4" />
      </button>
    </div>
  );
}
