import Link from "next/link";
import {
  Radar,
  Network,
  Globe,
  Bug,
  Globe2,
  Box,
  Clock,
  FileJson,
  Target,
  ArrowRight,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const scanners = [
  {
    icon: Network,
    name: "Nmap",
    subtitle: "Network Discovery & Security Auditing",
    description:
      "The industry-standard network mapper. Samma runs Nmap as containerized jobs to discover hosts, open ports, running services, and OS fingerprints across your cluster.",
    features: [
      "Port scanning & service detection",
      "OS fingerprinting",
      "NSE script execution",
      "Scheduled & on-demand scans",
    ],
  },
  {
    icon: Globe,
    name: "Nikto",
    subtitle: "Web Server Vulnerability Scanner",
    description:
      "Comprehensive web server testing against thousands of known vulnerabilities, misconfigurations, and outdated software versions.",
    features: [
      "6,700+ vulnerability checks",
      "SSL/TLS configuration testing",
      "Server & software identification",
      "CGI directory scanning",
    ],
  },
  {
    icon: Bug,
    name: "Tsunami",
    subtitle: "Network Security Scanner",
    description:
      "Google's general-purpose network security scanner with an extensible plugin system for detecting high-severity vulnerabilities with high confidence.",
    features: [
      "Plugin-based detection engine",
      "Low false-positive rate",
      "Remote code execution detection",
      "Exposed sensitive UI detection",
    ],
  },
  {
    icon: Globe2,
    name: "DNSRecon",
    subtitle: "DNS Enumeration & Reconnaissance",
    description:
      "DNS enumeration tool for discovering zone transfers, subdomains, DNS records, and potential misconfigurations in your DNS infrastructure.",
    features: [
      "Zone transfer testing",
      "Subdomain brute-forcing",
      "DNS record enumeration",
      "Cache snooping detection",
    ],
  },
];

const platformFeatures = [
  {
    icon: Target,
    title: "Auto-Detection",
    description:
      "The Kubernetes operator watches for new services and endpoints. New targets are automatically added to the scan queue — no manual configuration needed.",
  },
  {
    icon: Clock,
    title: "Scheduled Scans",
    description:
      "Define cron-based schedules per scanner and target. Scans also trigger automatically when new targets are discovered in your cluster.",
  },
  {
    icon: Box,
    title: "Containerized Execution",
    description:
      "Every scanner runs as an isolated Kubernetes job. No host dependencies, clean environments, and automatic resource management.",
  },
  {
    icon: FileJson,
    title: "Structured JSON Output",
    description:
      "All scan results are normalized to structured JSON and published to NATS. Consume them in Elasticsearch, Grafana, or your own tooling.",
  },
];

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
                Multi-Scanner Orchestration
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
              Industry-Standard Scanners,{" "}
              <span className="text-samma-gold">Fully Automated</span>
            </h1>
            <p className="text-lg text-gray-300 mb-10 leading-relaxed">
              Samma orchestrates Nmap, Nikto, Tsunami, and DNSRecon as
              containerized Kubernetes jobs. Auto-detect targets, schedule
              scans, and stream structured results to your existing tools.
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

      {/* Scanners */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Built-in Scanners
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Four battle-tested security scanners, each running in its own
              container with full isolation and resource control.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {scanners.map((scanner) => (
              <div
                key={scanner.name}
                className="border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="rounded-lg bg-samma-lavender p-3">
                    <scanner.icon className="h-7 w-7 text-samma-navy" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {scanner.name}
                    </h3>
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

      {/* Platform Features */}
      <section className="py-20 bg-samma-lavender">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How Scanning Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From target discovery to structured output, every step is
              automated and Kubernetes-native.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {platformFeatures.map((feature) => (
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

      {/* CTA */}
      <section className="bg-samma-navy py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start scanning in minutes
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Deploy Samma with Helm, point it at your cluster, and let the
            scanners do the rest. Results flow to Elasticsearch, Grafana, or
            any tool you already use.
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
