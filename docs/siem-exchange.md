# Samma rule exchange — API contract

Rules and a community blocklist go **down** from samma.io to every subscribed
SIEM; attacker IPs come **up** from SIEMs that opted in. Picture:
"Samma Rule Exchange" artifact. This file is the contract for the two other
sides: the detection-engine CI (publishes rulesets) and `siem-reporter`
(pulls the feed, posts indicators).

## Keys

| Key | Who holds the private half | Signs | Env on the app |
|---|---|---|---|
| Rules key (Ed25519) | Offline / CI secret of detection-engine only | Ruleset bundles | `SIEM_RULES_PUBLIC_KEY` (public half) |
| Blocklist key (Ed25519) | The app | Blocklist snapshots | `SIEM_BLOCKLIST_SIGNING_KEY` (private) |

A SIEM pins **both public keys** in its own config, separately. It accepts a
ruleset only with the rules key and a blocklist only with the blocklist key, so
a compromised app can at worst publish blocks (capped by the SIEM's local
policy and allowlist), never rules.

```sh
openssl genpkey -algorithm ed25519 -out rules.pem              # keep offline
openssl pkey -in rules.pem -pubout -outform DER | base64 -w0   # → SIEM_RULES_PUBLIC_KEY
openssl genpkey -algorithm ed25519 -outform DER | base64 -w0   # → SIEM_BLOCKLIST_SIGNING_KEY
```

Signatures are raw Ed25519 (64 bytes, base64) over the exact bytes served.

## Publish a ruleset (detection-engine CI)

```
POST /api/v1/siem/releases
Authorization: Bearer $SIEM_PUBLISH_TOKEN
Content-Type: application/gzip
X-Samma-Lane: traefik                  # ^[a-z][a-z0-9-]{0,31}$
X-Samma-Version: 2026.11.26-1          # ^[0-9A-Za-z][0-9A-Za-z.+-]{0,39}$, immutable
X-Samma-Rule-Count: 6
X-Samma-Signature: <base64 Ed25519 over the body>
X-Samma-Summary: +1 rule: traefik_jndi_injection   # optional, ≤ 300 chars
<body: tar.gz of rules/<lane>/, ≤ 5 MB>
```

201 `{lane, version, sha256}` · 400 bad header / not gzip / bad signature ·
401 token · 409 version exists · 413 too large · 503 rules key not set.

The bundle is a tar.gz whose entries are the lane's rule files relative to
the lane directory (`*.yml`, `sigma-config.yml`; tests optional). The app
never opens it.

## Pull (siem-reporter)

All three need `Authorization: Bearer samma_siem_…` and an active
`SiemSubscription` for the SIEM's organisation (else 403).

### `GET /api/v1/siem/feed`

Atom. Send `If-None-Match` with the last `ETag`; unchanged → 304. Poll every
5 minutes. Links are root-relative: join them with the samma.io base URL.

```xml
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:s="https://samma.io/ns/siem-feed/1">
  <entry>
    <id>urn:samma:ruleset:traefik:2026.11.26-1</id>
    <link rel="enclosure" type="application/gzip" href="/api/v1/siem/bundles/traefik/2026.11.26-1"/>
    <s:type>ruleset</s:type><s:lane>traefik</s:lane><s:version>2026.11.26-1</s:version>
    <s:rule-count>6</s:rule-count><s:sha256>…</s:sha256><s:sig>…</s:sig>
  </entry>
  <entry>
    <id>urn:samma:blocklist:12</id>
    <link rel="enclosure" type="application/json" href="/api/v1/siem/blocklist?version=12"/>
    <s:type>blocklist</s:type><s:version>12</s:version><s:sha256>…</s:sha256><s:sig>…</s:sig>
  </entry>
</feed>
```

One `ruleset` entry per lane (the latest), at most one `blocklist` entry.
Ignore unknown `s:type` values.

### `GET /api/v1/siem/bundles/<lane>/<version>`

The tar.gz. Before use: SHA-256 equals the feed's `s:sha256`, the signature
verifies with the **pinned rules key**, and the engine's `rulecheck` passes.
Any failure → keep the current ruleset and report the error.

### `GET /api/v1/siem/blocklist?version=N`

The exact signed JSON (verify with the **pinned blocklist key**):

```json
{
  "schema": "samma.blocklist/1",
  "version": 12,
  "generated_at": "2026-11-26T09:00:00.000Z",
  "expires_at": "2026-11-27T09:00:00.000Z",
  "min_orgs": 3,
  "block": [{ "ip": "203.0.113.47", "category": "sql-injection", "rule_ids": ["…"], "orgs": 4 }],
  "allow": [{ "ip": "198.51.100.12", "reason": "monitoring service" }]
}
```

The snapshot replaces the previous one as a whole. Drop all its blocks after
`expires_at` (the app re-signs at least every 12 h). `allow` lifts community
blocks only; it never overrides a local block or the local allowlist. Whether
a community block is enforced or only alerts is the SIEM's local policy.

## Report attackers (siem-reporter, opt-in)

Off until an organisation OWNER turns on **Share attackers with Samma** on the
SIEM's dashboard page (otherwise 403). Turning it off deletes what the SIEM
shared.

```
POST /api/v1/siem/indicators
Authorization: Bearer samma_siem_…
{"indicators": [{
  "ip": "203.0.113.47", "rule_id": "<sigma id>", "category": "sql-injection",
  "count": 3, "first_seen": "2026-11-26T08:01:00Z", "last_seen": "2026-11-26T08:04:10Z"
}]}
```

- `count` = new alerts since the previous post; the app adds them up.
- At most 500 entries and 256 KB per post, one post per 20 s (429).
- `category`: `^[a-z0-9][a-z0-9-]{0,39}$`, e.g. `sql-injection`,
  `path-traversal`, `sensitive-file`, `attack-tool`, `jndi-injection`.
- Private, reserved, multicast and documentation IPv6 addresses, and entries
  older than 7 days, are skipped, not rejected.
- 200 `{accepted, skipped}`.
- Never send the attacked host, path, headers or anything else from the event.

## How the blocklist is made

Indicators seen in the last 7 days, grouped by IP. An IP is published when at
least `SIEM_BLOCKLIST_MIN_ORGS` (default 3) **different organisations**
reported it, unless it is in `SiemCommunityAllow` (set by hand) or in
`SIEM_BLOCKLIST_EXCLUDE`. Rows older than 7 days are deleted. Each app process
re-checks at most every 5 minutes, on feed and blocklist requests.
