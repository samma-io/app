import Link from "next/link";
import {
  FileText,
  Radio,
  ShieldCheck,
  Bell,
  ArrowRight,
  Github,
  Zap,
  Workflow,
  Send,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const capabilities = [
  {
    icon: FileText,
    title: "YAML-Based Rules",
    description:
      "Define detection rules in simple YAML. Each rule specifies conditions, severity, NATS subjects to listen on, and compliance framework mappings. Version-control your entire rule set alongside your infrastructure.",
  },
  {
    icon: Radio,
    title: "NATS Event Streaming",
    description:
      "All security events flow through NATS, providing a unified, high-throughput message bus. Scanner results, system logs, and Kubernetes events converge into a single real-time pipeline.",
  },
  {
    icon: Zap,
    title: "Real-Time Processing",
    description:
      "Events are evaluated against rules as they arrive. No batch delays. Alerts fire within seconds of detection, so your team can respond before an incident escalates.",
  },
  {
    icon: Send,
    title: "Flexible Alert Routing",
    description:
      "Route alerts to Slack, email, webhooks, PagerDuty, or any HTTP endpoint. Each rule can have its own destination, so the right team gets the right alert.",
  },
  {
    icon: Workflow,
    title: "Vector.dev Pipeline",
    description:
      "Vector.dev handles log ingestion, transformation, and routing. Parse, filter, and enrich events before they reach the rule engine or your storage backend.",
  },
  {
    icon: BookOpen,
    title: "Elasticsearch Storage",
    description:
      "All events and alerts are stored in Elasticsearch for powerful querying, historical analysis, and integration with Kibana dashboards you already know.",
  },
];

const frameworks = [
  {
    name: "PCI-DSS",
    description: "Payment Card Industry Data Security Standard",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    name: "GDPR",
    description: "General Data Protection Regulation",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    name: "HIPAA",
    description: "Health Insurance Portability and Accountability Act",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  {
    name: "NIST 800-53",
    description: "Security and Privacy Controls for Information Systems",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    name: "MITRE ATT&CK",
    description: "Adversarial Tactics, Techniques, and Common Knowledge",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
];

export default function SiemFeaturePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-samma-navy to-samma-navy-dark text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="h-6 w-6 text-samma-gold" />
              <span className="text-sm font-medium text-samma-gold uppercase tracking-wider">
                SIEM Rule Engine
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
              Real-Time Security Events,{" "}
              <span className="text-samma-gold">Compliance Built In</span>
            </h1>
            <p className="text-lg text-gray-300 mb-10 leading-relaxed">
              YAML-based detection rules with built-in compliance mappings.
              Events stream through NATS, match against your rules, and fire
              alerts to any destination &mdash; all in real time.
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
              <Link href="/scanners">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-samma-navy"
                >
                  Explore Scanners
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How the SIEM Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A lightweight, Kubernetes-native SIEM that processes security
              events through a real-time pipeline with compliance-aware rules.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <cap.icon className="h-8 w-8 text-samma-navy mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {cap.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {cap.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Frameworks */}
      <section className="py-20 bg-samma-lavender">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Compliance Frameworks
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every rule maps to one or more compliance frameworks. Know
              exactly which standards are covered and where gaps remain.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {frameworks.map((fw) => (
              <div
                key={fw.name}
                className={`rounded-lg border p-6 ${fw.color}`}
              >
                <h3 className="text-lg font-bold mb-1">{fw.name}</h3>
                <p className="text-sm opacity-80">{fw.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rule Example */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Simple Rule Definition
              </h2>
              <p className="text-lg text-gray-600">
                Rules are plain YAML. Define what to detect, how severe it is,
                and which compliance frameworks it maps to.
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 text-sm font-mono text-gray-300 overflow-x-auto">
              <pre>{`name: open-port-detected
description: Alert on newly discovered open ports
severity: medium
nats_subject: scanner.nmap.results
condition:
  field: open_ports
  operator: gt
  value: 0
compliance:
  pci_dss: ["2.2.2", "6.2"]
  nist_800_53: ["CM-7", "RA-5"]
actions:
  - type: alert
    destination: slack-security
  - type: store
    destination: elasticsearch`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-samma-navy py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Security events, your way
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Samma provides the data pipeline and rule engine. Visualize
            results in Grafana, Kibana, or any tool your team already uses.
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
