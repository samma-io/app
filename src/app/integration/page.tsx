import Link from "next/link";
import {
  ArrowRight,
  ArrowDown,
  Boxes,
  Cloud,
  Handshake,
  Network,
  KeyRound,
  FileJson,
  Activity,
  ScrollText,
  ShieldCheck,
  Lock,
  EyeOff,
  Ban,
  Github,
  BookOpen,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GITHUB_ORG_URL, GUIDE_LINKS } from "@/lib/constants";

export const metadata = {
  title: "Integration — Samma.io",
  description:
    "How samma.io connects your Kubernetes cluster to partner vulnerability scanners and pentest services, and brings the results back as logs and Prometheus metrics.",
};

// ─── Content ──────────────────────────────────────────────────────────────────

const lanes = [
  {
    icon: Boxes,
    title: "Your cluster",
    points: ["samma operator watches your Ingresses", "Collector exports results as metrics and logs"],
  },
  {
    icon: Cloud,
    title: "samma.io cloud",
    points: ["Holds your targets and profiles", "Triggers partner scans, stores and formats results"],
  },
  {
    icon: Handshake,
    title: "Partner scanners",
    points: ["Vulnerability scanners and pentest services", "Run from outside, against your endpoint"],
  },
];

const steps = [
  {
    title: "Install the operator",
    body: "Install the samma operator in your own Kubernetes cluster with Helm. It runs Samma's open-source scanners inside the cluster.",
  },
  {
    title: "Connect it to samma.io",
    body: "Give the operator a samma.io API token. It now registers the hosts it scans as targets in your samma.io organisation, and the cluster shows up under Clusters.",
  },
  {
    title: "Annotate an Ingress",
    body: "Deploy an Ingress with samma-io.alpha.kubernetes.io/enable: \"true\". The operator picks up every host on it and registers it with samma.io.",
  },
  {
    title: "samma.io triggers the partners",
    body: "In samma.io you connect the partner scanners you want and enable them on a profile. Each new target in that profile is sent to those partners, and you can rescan at any time.",
  },
  {
    title: "Results come back to you",
    body: "samma.io collects each partner's result, turns it into findings and serves them with your other results. The collector in your cluster exports them as Prometheus metrics and log lines.",
  },
];

const helmSnippet = `helm upgrade --install samma-operator \\
  oci://ghcr.io/samma-io/charts/samma-operator \\
  --namespace samma-io --create-namespace \\
  --set config.apiUrl=https://www.samma.io \\
  --set config.apiToken=<samma.io API token> \\
  --set clusterName=prod-eu \\
  --set collector.enabled=true \\
  --set collector.apiToken=<read-only samma.io token>`;

const ingressSnippet = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: checkout
  annotations:
    samma-io.alpha.kubernetes.io/enable: "true"
    samma-io.alpha.kubernetes.io/profile: "web"
spec:
  rules:
    - host: checkout.example.com`;

const metrics = [
  ["samma_findings", "target, scanner, severity", "Findings of the latest run, per severity"],
  ["samma_scan_outcome", "target, scanner, outcome", "1 for the latest run's outcome"],
  ["samma_scan_last_finished_timestamp_seconds", "target, scanner", "When that run finished"],
  ["samma_target_info", "target, target_id, scanner_status, reachability", "1 per matched samma.io target"],
];

const logLine = `{"event":"samma.finding","target":"checkout.example.com",
 "scanner":"external:samma-demo","runId":"cmwp…","severity":"INFO",
 "title":"HTTPS reachable","host":"checkout.example.com","time":"…"}`;

const registerCall = `PUT /api/v1/targets
Authorization: Bearer <client's samma.io token>
X-Samma-Cluster: prod-eu

{ "value": "checkout.example.com", "type": "dns",
  "label": "checkout.example.com", "profileId": "<optional>" }`;

const startScanCall = `POST {partner}/scans
Authorization: Bearer <client's key for this partner>
Content-Type: application/json

{ "target": "checkout.example.com", "port": 443,
  "samma_id": "<samma.io target id>" }

→ 202 Accepted
{ "uuid": "05afc60c-464b-4b0a-97b1-4a0ce1b86fdb",
  "status": "running", "started_at": "2026-11-20T16:45:09Z" }`;

const getResultCall = `GET {partner}/scans/05afc60c-464b-4b0a-97b1-4a0ce1b86fdb
Authorization: Bearer <client's key for this partner>

→ 202 Accepted        { "status": "running" }
→ 404 Not Found       unknown scan
→ 200 OK              Content-Type: application/json
{
  "status": "completed",
  "findings": [
    { "id": "TLS-OLD-PROTOCOL", "title": "TLS 1.0 enabled",
      "severity": "high", "detail": "checkout.example.com:443 accepts TLS 1.0" }
  ]
}`;

const resultsCall = `GET /api/v1/targets/<id>/results
Authorization: Bearer <read-only samma.io token>

→ 200 OK
{
  "targetId": "cmwp7rpj6…",
  "runs": [
    { "scanner": "external:samma-demo", "runId": "cmwp8…",
      "outcome": "succeeded", "finishedAt": "2026-11-20T16:50:02Z",
      "findingCount": 1,
      "severity": { "CRITICAL": 0, "HIGH": 1, "MEDIUM": 0, "LOW": 0, "INFO": 0 } }
  ],
  "results": [
    { "scanner": "external:samma-demo", "runId": "cmwp8…",
      "checkId": "TLS-OLD-PROTOCOL", "severity": "HIGH",
      "title": "TLS 1.0 enabled", "host": "checkout.example.com",
      "time": "2026-11-20T16:50:02Z" }
  ]
}`;

const partnerRules = [
  "Accept only an IP address or a plain hostname as target, and validate it again on your side.",
  "Answer POST /scans within 10 seconds; run the scan in the background.",
  "Finish a scan within 24 hours. Until then, answer 202 for its uuid.",
  "Return the result as application/json, at most 1 MB. Other content types are rejected.",
  "Use status \"failed\" when a scan could not run. Failed runs are not billed.",
  "Severity is one of critical, high, medium, low or info. Anything else counts as info.",
  "Never log the client's key. It identifies the client, and samma.io stores it encrypted.",
];

const security = [
  {
    icon: ShieldCheck,
    title: "Only your own targets",
    body: "A scan is only sent for a target that belongs to your organisation, checked on the server before any partner is called.",
  },
  {
    icon: Lock,
    title: "Keys encrypted at rest",
    body: "The key you get from a partner is stored with AES-256-GCM, sent only to that partner, never shown again and never logged.",
  },
  {
    icon: Ban,
    title: "Private hosts stay private",
    body: "Hosts that resolve to private addresses, or not at all, are listed but never sent to a partner.",
  },
  {
    icon: EyeOff,
    title: "Evidence stays out of logs",
    body: "The collector logs severity, title, host and time. Evidence and partner detail are never written to your logs.",
  },
];

const comingNext = [
  "Choose partner scanners per Ingress with an annotation, next to the profile they land in.",
  "Partner scans on a schedule, not only for new targets and rescans.",
  "Partners push results to samma.io when a scan is done, instead of samma.io asking.",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-samma-navy text-gray-100 text-xs sm:text-sm rounded-lg p-4 overflow-x-auto leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function SectionHeader({ title, intro }: { title: string; intro: string }) {
  return (
    <div className="text-center mb-14">
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
      <p className="text-lg text-gray-600 max-w-3xl mx-auto">{intro}</p>
    </div>
  );
}

export default function IntegrationPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-samma-navy to-samma-navy-dark text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Network className="h-6 w-6 text-samma-gold" />
              <span className="text-sm font-medium text-samma-gold uppercase tracking-wider">
                Integration
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
              Your cluster, our partners,{" "}
              <span className="text-samma-gold">one feed of findings</span>
            </h1>
            <p className="text-lg text-gray-300 mb-10 leading-relaxed">
              Run the samma operator in your Kubernetes cluster and connect it to samma.io. Every
              host you publish through an Ingress can then be scanned by partner vulnerability
              scanners and pentest services, through one connection. The results come back to your
              cluster as Prometheus metrics and log lines.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#clients">
                <Button variant="primary" size="lg">
                  <Rocket className="mr-2 h-5 w-5" />
                  For clients
                </Button>
              </a>
              <a href="#partners">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-samma-navy"
                >
                  <Handshake className="mr-2 h-5 w-5" />
                  For partners
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-samma-lavender">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="How it works"
            intro="Three parties, one loop: your cluster tells samma.io what to scan, samma.io asks the partners you chose, and the findings flow back to where you already watch your systems."
          />

          {/* Flow diagram */}
          <div className="flex flex-col lg:flex-row items-stretch gap-4 mb-16">
            {lanes.map((lane, i) => (
              <div key={lane.title} className="flex flex-col lg:flex-row items-center gap-4 flex-1">
                <div className="bg-white rounded-lg p-6 shadow-sm border-t-4 border-samma-navy w-full h-full">
                  <lane.icon className="h-8 w-8 text-samma-navy mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{lane.title}</h3>
                  <ul className="space-y-2">
                    {lane.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-samma-gold flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                {i < lanes.length - 1 && (
                  <div className="flex lg:flex-col items-center gap-1 text-samma-navy text-xs font-medium flex-shrink-0">
                    <ArrowRight className="hidden lg:block h-5 w-5" />
                    <ArrowDown className="lg:hidden h-5 w-5" />
                    <span className="text-gray-500">{i === 0 ? "targets" : "scan request"}</span>
                    <span className="text-gray-500">{i === 0 ? "results" : "result (JSON)"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((s, i) => (
              <li key={s.title} className="bg-white rounded-lg p-6 shadow-sm">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-samma-navy text-white text-sm font-bold mb-3">
                  {i + 1}
                </span>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed break-words">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* For clients */}
      <section id="clients" className="py-20 bg-white scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="For clients"
            intro="One operator in your cluster gives you Samma's own scanners plus every partner you connect in samma.io. You don't need an account with each vendor."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">1. Install and connect</h3>
              <p className="text-gray-600 mb-4">
                Create two tokens under Dashboard → API Tokens: one for the operator, and a
                read-only one for the collector that brings results back.
              </p>
              <Code>{helmSnippet}</Code>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">2. Annotate your Ingress</h3>
              <p className="text-gray-600 mb-4">
                Every host on an opted-in Ingress becomes a samma.io target. Partner scanners
                enabled on the target&apos;s profile scan it as soon as it arrives.
              </p>
              <Code>{ingressSnippet}</Code>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="h-6 w-6 text-samma-navy" />
                <h3 className="text-xl font-bold text-gray-900">Prometheus metrics</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                The collector polls samma.io every 5 minutes and serves{" "}
                <code className="text-samma-navy">:9100/metrics</code>. Partner results use the
                scanner name <code className="text-samma-navy">external:&lt;partner&gt;</code>.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="py-2 pr-4 font-normal">Metric</th>
                      <th className="py-2 pr-4 font-normal">Labels</th>
                      <th className="py-2 font-normal">Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map(([name, labels, meaning]) => (
                      <tr key={name} className="border-b border-gray-50 align-top">
                        <td className="py-2 pr-4 font-mono text-xs text-gray-900 break-all">{name}</td>
                        <td className="py-2 pr-4 text-xs text-gray-500">{labels}</td>
                        <td className="py-2 text-gray-600">{meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <ScrollText className="h-6 w-6 text-samma-navy" />
                <h3 className="text-xl font-bold text-gray-900">Log lines</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                One JSON line per finding of each new run, on the collector&apos;s stdout, ready for
                Loki or any log shipper.
              </p>
              <Code>{logLine}</Code>
            </div>
          </div>
        </div>
      </section>

      {/* For partners */}
      <section id="partners" className="py-20 bg-samma-lavender scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="For partners"
            intro="Offer your scanner or pentest service to every samma.io client through one small HTTP API. samma.io sends you targets and fetches your results; you never deal with the client's cluster."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <KeyRound className="h-7 w-7 text-samma-navy mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">One key per client</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                You issue an API key to the client. They paste it into samma.io when they connect
                your scanner, and every call samma.io makes for them carries it as a Bearer token.
                That is how you know who to bill.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Network className="h-7 w-7 text-samma-navy mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Two endpoints</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                <code>POST /scans</code> starts a scan and returns its uuid.{" "}
                <code>GET /scans/&lt;uuid&gt;</code> returns the result once it is ready. samma.io
                asks for it when the client opens the target, and keeps asking until it is done.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <FileJson className="h-7 w-7 text-samma-navy mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">JSON results</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                The result must be <code>application/json</code>. A <code>findings</code> list is
                turned into findings with severities; any other JSON is shown to the client as it
                is.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">samma.io → partner: start a scan</h3>
              <Code>{startScanCall}</Code>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">samma.io → partner: fetch the result</h3>
              <Code>{getResultCall}</Code>
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">The rules of the API</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {partnerRules.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-samma-gold flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-600 mt-6">
              A minimal reference implementation is <code>samma-io/external-scanner</code>: a small
              Python service that does exactly this, with a placeholder scan you replace with your
              own.
            </p>
          </div>
        </div>
      </section>

      {/* Back to the cluster */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="The calls into samma.io"
            intro="Your cluster talks to samma.io with two tokens: one to register targets, one read-only token to read results back."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Operator → samma.io: register a host</h3>
              <p className="text-sm text-gray-600 mb-3">
                Sent for every host on an opted-in Ingress. samma.io keeps one target per profile
                and host, so repeated Ingress events don&apos;t create duplicates.
              </p>
              <Code>{registerCall}</Code>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Collector → samma.io: read results</h3>
              <p className="text-sm text-gray-600 mb-3">
                The latest run of every scanner on the target, Samma&apos;s own and the
                partners&apos;, in one shape.
              </p>
              <Code>{resultsCall}</Code>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 bg-samma-lavender">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Built for a security product"
            intro="Findings are a map of how to break in. The integration is designed so they, and the keys behind them, stay with the people who own them."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {security.map((s) => (
              <div key={s.title} className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-samma-navy">
                <s.icon className="h-7 w-7 text-samma-navy mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming next + CTA */}
      <section className="bg-samma-navy py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Coming next</h2>
          <ul className="text-left space-y-3 mb-12 max-w-2xl mx-auto">
            {comingNext.map((c) => (
              <li key={c} className="flex items-start gap-2 text-gray-300">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-samma-gold flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
          <p className="text-lg text-gray-300 mb-8">
            Want your scanner or pentest service on samma.io, or want to connect your cluster?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={GUIDE_LINKS.externalScanners} target="_blank" rel="noopener noreferrer">
              <Button variant="primary" size="lg">
                <BookOpen className="mr-2 h-5 w-5" />
                Read the guide
              </Button>
            </a>
            <a href={GITHUB_ORG_URL} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-samma-navy"
              >
                <Github className="mr-2 h-5 w-5" />
                Talk to us on GitHub
              </Button>
            </a>
            <Link href="/sign-in">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-samma-navy"
              >
                Get started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
