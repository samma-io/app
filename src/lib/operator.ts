import type { ProfileType } from "@prisma/client";

/**
 * Resolves the operator API credentials from the environment.
 *
 * Returns null only when OPERATOR_API_URL is unset (operator integration not
 * configured — normal in development; the caller stays silent and no request
 * is sent).
 *
 * Throws when OPERATOR_API_URL is set but OPERATOR_API_TOKEN is missing or
 * empty: the operator API enforces bearer authentication, so a request sent
 * without the Authorization header could never succeed. Failing loudly here
 * keeps the invariant that no request ever leaves this module unauthenticated.
 * Error messages name the variable only — the token value is never logged.
 */
function operatorAuth(): { baseUrl: string; token: string } | null {
  const url = process.env.OPERATOR_API_URL;
  if (!url) return null;

  const token = process.env.OPERATOR_API_TOKEN;
  if (!token) {
    console.error(
      "[operator] OPERATOR_API_TOKEN is missing or empty while OPERATOR_API_URL is set — refusing to send an unauthenticated request to the operator API"
    );
    throw new Error(
      "Misconfigured operator integration: OPERATOR_API_URL is set but OPERATOR_API_TOKEN is missing. Set OPERATOR_API_TOKEN (the bearer token shared with the operator API) alongside OPERATOR_API_URL."
    );
  }

  return { baseUrl: url.replace(/\/$/, ""), token };
}

/**
 * Notifies the operator's Flask API about a new scan target so it can deploy
 * the appropriate Kubernetes Scanner CRDs. Every request is authenticated with
 * an "Authorization: Bearer <OPERATOR_API_TOKEN>" header.
 *
 * Returns true on success (2xx / 207), false if OPERATOR_API_URL is not set
 * or the call fails. Throws when OPERATOR_API_URL is set but
 * OPERATOR_API_TOKEN is missing or empty (misconfiguration) — callers should
 * .catch() to avoid unhandled rejections.
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
 * Returns "removed" on success or 404 (already gone), "not_configured" if
 * OPERATOR_API_URL is unset, or "failed" for network errors / unexpected
 * response statuses (logged via console.error).
 *
 * Throws when OPERATOR_API_URL is set but OPERATOR_API_TOKEN is missing or
 * empty, so the misconfiguration surfaces as a loud error from the caller
 * instead of a request going out unauthenticated — this deliberately replaces
 * the previous "never throws" contract. Callers that must tolerate it should
 * .catch() and treat the rejection as "failed". Every request is authenticated
 * with an "Authorization: Bearer <OPERATOR_API_TOKEN>" header.
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
