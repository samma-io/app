import type { ProfileType } from "@prisma/client";

/**
 * Resolves the operator API base URL and bearer token for an operator call.
 *
 * Returns null when OPERATOR_API_URL is unset (operator integration not
 * configured — normal in development). Throws when OPERATOR_API_URL is set
 * but OPERATOR_API_TOKEN is missing or empty, so no request is ever sent
 * without an Authorization header. Server-only: OPERATOR_API_TOKEN must
 * never get a NEXT_PUBLIC_ prefix.
 */
function operatorAuth(): { baseUrl: string; token: string } | null {
  const url = process.env.OPERATOR_API_URL;
  if (!url) return null;

  const token = process.env.OPERATOR_API_TOKEN;
  if (!token) {
    console.error(
      "[operator] OPERATOR_API_TOKEN is not set; refusing to send an unauthenticated request to the operator API"
    );
    throw new Error(
      "OPERATOR_API_TOKEN is not set; refusing to send an unauthenticated request to the operator API (set OPERATOR_API_TOKEN alongside OPERATOR_API_URL)"
    );
  }

  return { baseUrl: url.replace(/\/$/, ""), token };
}

/**
 * Notifies the operator's Flask API about a new scan target so it can deploy
 * the appropriate Kubernetes Scanner CRDs.
 *
 * Sends an Authorization: Bearer header from OPERATOR_API_TOKEN.
 *
 * Returns true on success (2xx / 207), false if OPERATOR_API_URL is not set
 * or the call fails. Throws when OPERATOR_API_URL is set but OPERATOR_API_TOKEN
 * is missing or empty (misconfiguration — the calling server action surfaces
 * it as a 500). Callers should .catch() to avoid unhandled rejections.
 */
export async function registerTargetWithOperator(
  targetValue: string,
  targetId: string,
  profileType: ProfileType,
  profileId: string
): Promise<boolean> {
  const auth = operatorAuth();
  if (!auth) return false;

  const profile = profileType === "FULL" ? "all" : "detect";

  const res = await fetch(`${auth.baseUrl}/target`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
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
 * Sends an Authorization: Bearer header from OPERATOR_API_TOKEN.
 *
 * Returns "removed" on success or 404 (already gone), "not_configured" if
 * OPERATOR_API_URL is unset, or "failed" for network errors / unexpected
 * response statuses (logged via console.error). Throws when OPERATOR_API_URL
 * is set but OPERATOR_API_TOKEN is missing or empty — a missing token in
 * production must surface as a loud 500 from the calling server action, not a
 * silent auth failure. "not_configured" and "failed" behave as before.
 */
export async function removeTargetFromOperator(
  targetValue: string
): Promise<RemoveTargetResult> {
  const auth = operatorAuth();
  if (!auth) return "not_configured";

  try {
    const res = await fetch(`${auth.baseUrl}/target`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
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
