import Link from "next/link";
import {
  ArrowRight,
  ArrowDown,
  Boxes,
  Cloud,
  Handshake,
  Radar,
  Siren,
  LayoutDashboard,
  ScanSearch,
  ShieldCheck,
  Server,
  KeyRound,
  Ban,
  EyeOff,
  Lock,
  Receipt,
  Github,
  BookOpen,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GITHUB_ORG_URL, GUIDE_LINKS } from "@/lib/constants";

export const metadata = {
  title: "Partners — Samma.io",
  description:
    "How the Samma platform works, and how scanner vendors, pentest services, SOC teams and platform partners plug into it.",
};

// ─── Content ──────────────────────────────────────────────────────────────────

const parts = [
  {
    icon: Radar,
    title: "Scanner",
    where: "outside-in · what is exposed",
    body: "Every Ingress with the Samma annotations is found by itself and scanned from the internet: open ports, TLS, security headers, DNS, redirects. Samma's own scanners run on every target, and a profile can add scanners from partners.",
  },
  {
    icon: Siren,
    title: "SIEM",
    where: "inside · what is happening",
    body: "Logs from endpoints, the cluster and SaaS accounts flow into one detection lane per source. Each lane runs Sigma rules and turns matches into alerts, from low to critical.",
  },
  {
    icon: LayoutDashboard,
    title: "samma.io",
    where: "one portal for both",
    body: "Targets, profiles and findings for the scanner. Lanes, versions, health and alert counts for the SIEM. The client's logs stay in the client's own cluster or account.",
  },
];

const scanZones = [
  {
    icon: Boxes,
    title: "Client cluster",
    points: [
      "The operator finds annotated Ingresses and registers their hosts",
      "The collector pulls findings back as Prometheus metrics and log lines",
    ],
  },
  {
    icon: Cloud,
    title: "samma.io",
    points: [
      "Groups targets into profiles",
      "Runs Samma's scanners and starts the partner scans the profile has on",
    ],
  },
  {
    icon: Handshake,
    title: "Partner scanner",
    points: [
      "Scans the public host from your own network",
      "Serves a JSON result that samma.io fetches",
    ],
  },
];

const scanSteps = [
  "An Ingress gets the Samma annotations in git.",
  "The operator registers the host on samma.io over outbound HTTPS.",
  "The host joins its profile, with the scanners the client chose.",
  "samma.io calls the partner's scan API for the new target.",
  "The partner scans it from outside, the way an attacker would.",
  "samma.io fetches the result and stores it next to Samma's own findings.",
  "The collector in the client's cluster pulls every finding down.",
  "Findings land in the client's own Prometheus, Grafana and alerting.",
];

const siemFlow = [
  { title: "Sources", body: "osquery and Wazuh agents on endpoints, SaaS audit logs, and sources inside Kubernetes such as Falco and Trivy." },
  { title: "Ingest", body: "One ingest node per source checks the sender and publishes each record to its own lane." },
  { title: "Detection lanes", body: "One engine per lane runs Sigma rules. A match becomes an alert with a level and the rule behind it." },
  { title: "Alerts and storage", body: "Alerts are routed to Slack or GitHub issues; every record is kept in the client's own storage." },
  { title: "samma.io", body: "A reporter sends counts, versions and health every five minutes. No log or alert content leaves." },
];

const partnerTypes = [
  {
    icon: ScanSearch,
    title: "Scanner and pentest services",
    body: "Run your scanner against the hosts samma.io clients publish. You build two HTTP endpoints; samma.io sends targets with the client's key and fetches your JSON result.",
    points: [
      "Listed in the samma.io scanner catalog",
      "Your own price per scan, billed only for completed scans",
      "No client cluster to reach into, no vendor account per client to manage",
    ],
  },
  {
    icon: ShieldCheck,
    title: "SOC, MSSP and detection teams",
    body: "Clients choose which log events to send to a partner and get the partner's alerts back. Help them write detection rules for their environment, or run the SIEM for them.",
    points: [
      "Work on log flows the client owns and has filtered",
      "Sigma rules, so your detection content carries over",
      "One partner, several, or none: the client decides",
    ],
  },
  {
    icon: Server,
    title: "Platform and hosting",
    body: "The SIEM deploys into the client's own AWS account or Kubernetes cluster. Kubernetes deploys go through Ankra; consultancies can bring Samma to the clusters they already run.",
    points: [
      "Installed with Helm or Terraform, run by GitOps",
      "No extra transfer or storage fees: it is the client's account",
      "A natural add-on for teams that already run ArgoCD",
    ],
  },
];

const promises = [
  {
    icon: ShieldCheck,
    title: "Only owned targets",
    body: "samma.io only sends a target that belongs to the client's organisation, checked on the server before any partner is called.",
  },
  {
    icon: Ban,
    title: "Private hosts stay private",
    body: "A host that resolves to a private address, or not at all, is registered but never sent to a partner.",
  },
  {
    icon: Lock,
    title: "Your key, encrypted",
    body: "The key you issue to a client is stored with AES-256-GCM, sent only to you, and never logged.",
  },
  {
    icon: EyeOff,
    title: "You see the target, nothing else",
    body: "A partner gets the host it is asked to scan. Every connection is opened by the client's cluster or by samma.io; nobody connects in.",
  },
];

const onboarding = [
  {
    icon: KeyRound,
    title: "Issue keys to clients",
    body: "One API key per client, sent as a Bearer token on every call. That is how you know who to bill.",
  },
  {
    icon: Code2,
    title: "Build two endpoints",
    body: "POST /scans returns a uuid within 10 seconds; GET /scans/<uuid> returns 202 while running and JSON when done.",
  },
  {
    icon: Receipt,
    title: "Send us your catalog entry",
    body: "Your API URL, your price per scan and your key format. We add you to the scanner catalog.",
  },
  {
    icon: Handshake,
    title: "Clients turn you on",
    body: "A client pastes your key into samma.io and enables you on a profile. Every new host in it is sent to you.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function SectionHeader({ title, intro }: { title: string; intro: string }) {
  return (
    <div className="text-center mb-14">
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
      <p className="text-lg text-gray-600 max-w-3xl mx-auto">{intro}</p>
    </div>
  );
}

function Dot() {
  return <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-samma-gold flex-shrink-0" />;
}

export default function PartnersPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-samma-navy to-samma-navy-dark text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Handshake className="h-6 w-6 text-samma-gold" />
              <span className="text-sm font-medium text-samma-gold uppercase tracking-wider">
                Partners
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
              Bring your scanner, SOC or platform to{" "}
              <span className="text-samma-gold">Kubernetes teams</span>
            </h1>
            <p className="text-lg text-gray-300 mb-10 leading-relaxed">
              Samma is security for Kubernetes in two parts that share one portal: a scanner that
              looks at a cluster from the outside, and a SIEM that watches what happens inside.
              Partners plug into both. This page shows how the platform works and where you fit.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#ways">
                <Button variant="primary" size="lg">
                  Ways to partner
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <Link href="/integration#partners">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-samma-navy"
                >
                  <Code2 className="mr-2 h-5 w-5" />
                  Scanner API reference
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The platform */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="The platform"
            intro="Both parts are installed in the client's own cluster and report to samma.io. The client keeps control: scanning is switched on per Ingress in git, logs never leave their environment, and every connection to samma.io is opened from their side."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {parts.map((p) => (
              <div key={p.title} className="rounded-lg p-6 border border-gray-200 border-t-4 border-t-samma-navy">
                <p.icon className="h-8 w-8 text-samma-navy mb-3" />
                <h3 className="text-xl font-semibold text-gray-900">{p.title}</h3>
                <p className="text-xs font-mono text-gray-500 mb-3">{p.where}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scan flow */}
      <section className="py-20 bg-samma-lavender">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="How a scan reaches a partner"
            intro="A new Ingress in the client's cluster becomes a target on samma.io by itself, is scanned by Samma and by the partners on its profile, and the findings come back down into the cluster."
          />
          <div className="flex flex-col lg:flex-row items-stretch gap-4 mb-12">
            {scanZones.map((zone, i) => (
              <div key={zone.title} className="flex flex-col lg:flex-row items-center gap-4 flex-1">
                <div className="bg-white rounded-lg p-6 shadow-sm border-t-4 border-samma-navy w-full h-full">
                  <zone.icon className="h-8 w-8 text-samma-navy mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{zone.title}</h3>
                  <ul className="space-y-2">
                    {zone.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2 text-sm text-gray-600">
                        <Dot />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
                {i < scanZones.length - 1 && (
                  <div className="flex lg:flex-col items-center gap-1 text-xs font-medium flex-shrink-0">
                    <ArrowRight className="hidden lg:block h-5 w-5 text-samma-navy" />
                    <ArrowDown className="lg:hidden h-5 w-5 text-samma-navy" />
                    <span className="text-gray-500">{i === 0 ? "hosts" : "scan request"}</span>
                    <span className="text-gray-500">{i === 0 ? "findings" : "JSON result"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {scanSteps.map((s, i) => (
              <li key={s} className="bg-white rounded-lg p-5 shadow-sm flex gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-samma-navy text-white text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{s}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SIEM flow */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="How a log becomes an alert"
            intro="The SIEM runs in the client's own Kubernetes cluster or AWS account. Each source gets its own lane, so a partner can work on exactly the events a client chooses to share."
          />
          <ol className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {siemFlow.map((s, i) => (
              <li key={s.title} className="relative rounded-lg p-5 border border-gray-200">
                <span className="text-xs font-mono text-samma-navy">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-semibold text-gray-900 mt-1 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="text-center text-sm text-gray-500 mt-8">
            More on the SIEM: <Link href="/siem" className="text-samma-navy underline">samma.io/siem</Link>
          </p>
        </div>
      </section>

      {/* Ways to partner */}
      <section id="ways" className="py-20 bg-samma-lavender scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Ways to partner"
            intro="Three kinds of partners, each with a clear place in the flow."
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {partnerTypes.map((t) => (
              <div key={t.title} className="bg-white rounded-lg p-6 shadow-sm flex flex-col">
                <t.icon className="h-8 w-8 text-samma-navy mb-3" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{t.body}</p>
                <ul className="space-y-2 mt-auto">
                  {t.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-sm text-gray-700">
                      <Dot />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-600 mt-8">
            Kubernetes hosting partner:{" "}
            <a href="https://ankra.io" target="_blank" rel="noopener noreferrer" className="text-samma-navy underline">
              Ankra
            </a>
          </p>
        </div>
      </section>

      {/* Scanner onboarding */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Add your scanner in four steps"
            intro="The whole contract is two HTTP calls. A reference implementation, samma-io/external-scanner, is a small Python service with a placeholder scan you replace with your own."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {onboarding.map((o, i) => (
              <div key={o.title} className="rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-samma-navy text-white text-xs font-bold">
                    {i + 1}
                  </span>
                  <o.icon className="h-6 w-6 text-samma-navy" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{o.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{o.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/integration#partners">
              <Button variant="primary" size="lg">
                Full API contract and payloads
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Promises */}
      <section className="py-20 bg-samma-lavender">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Built for a security product"
            intro="Findings are a map of how to break in. The platform is designed so they, and the keys behind them, stay with the people who own them."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {promises.map((p) => (
              <div key={p.title} className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-samma-navy">
                <p.icon className="h-7 w-7 text-samma-navy mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-samma-navy py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Want to partner with Samma?</h2>
          <p className="text-lg text-gray-300 mb-8">
            Read the guide, try the reference scanner, and reach out to us on GitHub.
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
          </div>
        </div>
      </section>
    </div>
  );
}
