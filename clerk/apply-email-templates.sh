#!/usr/bin/env bash
# Push the branded Clerk email templates in clerk/emails/ to the Clerk instance.
# Custom email templates need a paid Clerk plan; on the free plan Clerk answers
# "unsupported_subscription_plan_features" and nothing changes.
#
# usage: CLERK_SECRET_KEY=sk_live_... clerk/apply-email-templates.sh
# Revert to Clerk's default: curl -X POST -H "Authorization: Bearer $CLERK_SECRET_KEY" \
#   https://api.clerk.com/v1/templates/email/verification_code/revert
set -euo pipefail
: "${CLERK_SECRET_KEY:?set CLERK_SECRET_KEY}"
dir="$(cd "$(dirname "$0")" && pwd)/emails"

apply() { # slug name subject
  jq -n --rawfile body "$dir/$1.html" --arg name "$2" --arg subject "$3" \
    '{name: $name, subject: $subject, body: $body, from_email_name: "samma", delivered_by_clerk: true}' |
  curl -sS -X PUT "https://api.clerk.com/v1/templates/email/$1" \
    -H "Authorization: Bearer $CLERK_SECRET_KEY" -H "Content-Type: application/json" --data @- |
  jq -c --arg slug "$1" 'if .errors then {slug: $slug, error: .errors[0].long_message} else {slug, subject, updated_at} end'
}

# Sent for sign-in and sign-up (email_code is the only first factor).
apply verification_code "Verification code" "{{otp_code}} is your Samma.io code"
