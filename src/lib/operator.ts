import type { ProfileType } from "@prisma/client";

/**
 * Notifies the operator's Flask API about a new scan target so it can deploy
 * the appropriate Kubernetes Scanner CRDs.
 *
 * Returns true on success (2xx / 207), false if OPERATOR_API_URL is not set
 * or the call fails. Callers should .catch() to avoid unhandled rejections.
 */
export async function registerTargetWithOperator(
  targetValue: string,
  targetId: string,
  profileType: ProfileType,
  profileId: string
): Promise<boolean> {
  const url = process.env.OPERATOR_API_URL;
  if (!url) return false;

  const profile = profileType === "FULL" ? "all" : "detect";

  const res = await fetch(`${url.replace(/\/$/, "")}/target`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target: targetValue,
      samma_io_id: targetId,
      profile,
      samma_io_tags: `samma,${profileId}`,
      samma_io_json: JSON.stringify({ profileId }),
    }),
  });

  return res.ok || res.status === 207;
}

/**
 * Outcome of a removal request to the operator:
 * - "removed" — operator acknowledged deletion (2xx) or reported the target
 *   as already gone (404)
 * - "not_configured" — OPERATOR_API_URL is unset (normal in development), no
 *   call was made
 * - "failed" — the call could not be completed (network error or unexpected
 *   response status)
 */
export type RemoveTargetResult = "removed" | "not_configured" | "failed";

/**
 * Removes a scan target from the operator (deletes all Scanner CRDs for that target).
 *
 * Never throws. Returns "removed" on success or 404 (already gone),
 * "not_configured" if OPERATOR_API_URL is unset, or "failed" for network
 * errors / unexpected response statuses (logged via console.error).
 * Callers no longer need to .catch() — check the returned outcome instead.
 */
export async function removeTargetFromOperator(
  targetValue: string
): Promise<RemoveTargetResult> {
  const url = process.env.OPERATOR_API_URL;
  if (!url) return "not_configured";

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/target`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: targetValue }),
    });

    if (res.ok || res.status === 404) return "removed";
    console.error(`[operator] remove failed with status ${res.status} for target "${targetValue}"`);
    return "failed";
  } catch (err) {
    console.error(`[operator] remove request failed for target "${targetValue}":`, err);
    return "failed";
  }
}
