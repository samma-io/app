import Link from "next/link";
import {
  Radar,
  Network,
  Globe,
  Bug,
  Lock,
  ShieldCheck,
  Route,
  Server,
  Fingerprint,
  Search,
  Target,
  Cloud,
  GitBranch,
  Trash2,
  ChartColumn,
  Layers,
  ArrowRight,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const detectScanners = [
  {
    icon: Lock,
    name: "TLS",
    description:
      "Certificate validity, expiry and days left, issuer, protocol and cipher. Catch expiring certificates and old TLS versions.",
  },
  {
    icon: ShieldCheck,
    name: "HTTP security headers",
    description:
      "HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy and Permissions-Policy, checked against OWASP secure-headers practice.",
  },
  {
    icon: Route,
    name: "HTTP redirects",
    description:
      "The full redirect chain, hop by hop. Make sure HTTP goes to HTTPS and nothing redirects somewhere unexpected.",
  },
  {
    icon: Network,
    name: "Ports",
    description:
      "Which TCP ports are open. Spot services that should never be exposed.",
  },
  {
    icon: Server,
    name: "SSH banner",
    description: "SSH server software and version. Find outdated SSH servers.",
  },
  {
    icon: Globe,
    name: "DNS",
    description:
      "A, AAAA, MX and TXT records. Track DNS changes and dangling records.",
  },
  {
    icon: Fingerprint,
    name: "WHOIS",
    description:
      "Registrar, creation and expiry dates, name servers. Never let a domain lapse.",
  },
  {
    icon: Search,
    name: "Traceroute",
    description: "The network path to a target, and when it changes.",
  },
];

const classicScanners = [
  {
    icon: Network,
    name: "Nmap",
    subtitle: "Ports, web recon and TLS ciphers",
    description:
      "The industry-standard network mapper, run in three modes: a full port scan, web server fingerprinting with http-enum, and a graded list of every TLS cipher and protocol the server accepts.",
    features: [
      "SYN port scan",
      "Service and web application detection",
      "TLS cipher and protocol grading",
    ],
  },
  {
    icon: Globe,
    name: "Nikto",
    subtitle: "OWASP-style web findings",
    description:
      "Tests web servers for dangerous files, outdated software and misconfiguration, the issues an attacker sees first.",
    features: [
      "Thousands of known-vulnerability checks",
      "Outdated server software",
      "Misconfiguration and default files",
    ],
  },
  {
    icon: Bug,
    name: "Tsunami",
    subtitle: "High-severity vulnerabilities",
    description:
      "Google's plugin-based scanner for the critical issues, with a low false-positive rate.",
    features: [
      "Remote code execution detection",
      "Exposed admin interfaces",
      "Weak credential detection",
    ],
  },
];

const howItWorks = [
  {
    icon: Target,
    title: "Follows your Ingresses",
    description:
      "Install the open-source operator and annotate an Ingress. Scanners start against every host in it, from inside your cluster.",
  },
  {
    icon: Cloud,
    title: "External scanners from samma.io",
    description:
      "Connect the operator to samma.io and your external hosts are shared with the portal. samma.io adds external scanners for an outside-in security baseline.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance scanners per target",
    description:
      "Tag an Ingress with pci-dss and samma.io runs a validated vendor scanner, such as a PCI ASV, against that endpoint. Use different vendors for different targets.",
  },
  {
    icon: ChartColumn,
    title: "Results in your own Grafana",
    description:
      "In-cluster, external and vendor findings all come back to Grafana inside your cluster, per target.",
  },
  {
    icon: Trash2,
    title: "Drop the Ingress, drop the scanners",
    description:
      "Scanners live as long as the target does. When an endpoint is gone, its scans and their cost are gone too.",
  },
  {
    icon: GitBranch,
    title: "Controlled from git",
    description:
      "Scanning is set by Ingress annotations, so it is reviewed and versioned with the rest of your manifests.",
  },
];

const ingressExample = `metadata:
  name: checkout
  annotations:
    samma-io.alpha.kubernetes.io/enable: "true"
    samma-io.alpha.kubernetes.io/profile: "web"
    samma-io.alpha.kubernetes.io/compliance: "pci-dss"`;

export default function ScannersFeaturePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-samma-navy to-samma-navy-dark text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Radar className="h-6 w-6 text-samma-gold" />
              <span className="text-sm font-medium text-samma-gold uppercase tracking-wider">
                Open-Source Kubernetes Scanners
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
              The Right Scanner on Every Endpoint,{" "}
              <span className="text-samma-gold">Driven by Your Ingress</span>
            </h1>
            <p className="text-lg text-gray-300 mb-10 leading-relaxed">
              Deploy Samma into any Kubernetes cluster. It picks up your
              Ingresses and scans them for TLS, security header, port and
              OWASP-style findings. Connect samma.io to add external scanners
              and validated compliance scanners, and read every result in your
              own Grafana.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://github.com/samma-io"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="primary" size="lg">
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </Button>
              </a>
              <Link href="/siem">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-samma-navy"
                >
                  Explore SIEM
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-samma-lavender">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How Scanning Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each endpoint gets the scanners it needs, and you only pay for
              scans while the endpoint exists.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {howItWorks.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-lg p-6 border-l-4 border-samma-navy shadow-sm"
              >
                <feature.icon className="h-8 w-8 text-samma-navy mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* In-cluster scanners */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Open-Source Scanners in Your Cluster
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every scanner runs as an isolated Kubernetes job, once straight
              away and then on a schedule. Pick them one by one or as a profile
              such as web, network or detect.
            </p>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Detect scanners
          </h3>
          <p className="text-gray-600 mb-8">
            Lightweight checks that are safe to run often.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {detectScanners.map((scanner) => (
              <div
                key={scanner.name}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="rounded-lg bg-samma-lavender p-3 w-fit mb-4">
                  <scanner.icon className="h-6 w-6 text-samma-navy" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  {scanner.name}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {scanner.description}
                </p>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Classic scanners
          </h3>
          <p className="text-gray-600 mb-8">
            Deeper, battle-tested tools that actively probe for
            vulnerabilities.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {classicScanners.map((scanner) => (
              <div
                key={scanner.name}
                className="border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="rounded-lg bg-samma-lavender p-3">
                    <scanner.icon className="h-7 w-7 text-samma-navy" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {scanner.name}
                    </h4>
                    <p className="text-sm text-samma-navy font-medium">
                      {scanner.subtitle}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 mb-5 leading-relaxed">
                  {scanner.description}
                </p>
                <ul className="space-y-2">
                  {scanner.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-samma-gold flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* samma.io: external and vendor scanners */}
      <section className="py-20 bg-samma-lavender">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              More Scanners with samma.io
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect the operator to samma.io with an API token. Your Ingress
              hosts are shared with the portal, and samma.io adds the scanners
              your cluster can&apos;t run on its own.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="rounded-lg bg-samma-lavender p-3">
                  <Cloud className="h-7 w-7 text-samma-navy" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    External scanners
                  </h3>
                  <p className="text-sm text-samma-navy font-medium">
                    An outside-in baseline
                  </p>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Attackers see your endpoints from the internet. samma.io scans
                every shared host from outside your network, so each target
                gets an external security baseline next to the in-cluster
                results, with no extra setup per host.
              </p>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="rounded-lg bg-samma-lavender p-3">
                  <Layers className="h-7 w-7 text-samma-navy" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Vendor and compliance scanners
                  </h3>
                  <p className="text-sm text-samma-navy font-medium">
                    Validated scanners, only where you need them
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-5 leading-relaxed">
                Compliance work such as PCI DSS needs scans from a validated
                vendor. Tag the Ingress and samma.io runs the right vendor
                scanner against that endpoint. Use one vendor for some targets
                and another for the rest. Vendors are connected on the samma.io
                side, so you don&apos;t need an account with each one.
              </p>
              <pre className="bg-samma-navy text-gray-100 text-xs sm:text-sm rounded-lg p-4 overflow-x-auto">
                <code>{ingressExample}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-samma-navy py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start scanning in minutes
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Install the operator with Helm, annotate your Ingresses, and keep
            it all in git. Every result lands in Grafana inside your own
            cluster.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/samma-io"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" size="lg">
                <Github className="mr-2 h-5 w-5" />
                Get Started on GitHub
              </Button>
            </a>
            <Link href="/about">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-samma-navy"
              >
                Learn More
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
