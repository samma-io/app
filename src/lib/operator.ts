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
