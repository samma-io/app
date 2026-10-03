import Link from "next/link";
import {
  FileText,
  Radio,
  ShieldCheck,
  ArrowRight,
  Github,
  Workflow,
  BookOpen,
  Cloud,
  Container,
  Database,
  Filter,
  Bell,
  Search,
  LayoutDashboard,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GITHUB_ORG_URL, GUIDE_LINKS, GUIDE_URL } from "@/lib/constants";

const deployments = [
  {
    id: "kubernetes",
    icon: Container,
    name: "Kubernetes SIEM",
    tagline: "What is happening inside my cluster?",
    description:
      "A lightweight rule engine that runs next to your workloads. Cluster events stream over NATS and are matched against compliance-mapped YAML rules.",
    points: [
      "Runs in any Kubernetes cluster",
      "YAML rules with PCI DSS, NIST, MITRE ATT&CK and more",
      "Alerts in Elasticsearch or Loki, viewed in Grafana",
      "Installs with Helm charts and plain manifests",
    ],
    guide: GUIDE_LINKS.kubernetesSiem,
    repo: "https://github.com/samma-io/siem",
  },
  {
    id: "aws",
    icon: Cloud,
    name: "AWS SIEM",
    tagline: "What is happening in my cloud and SaaS accounts?",
    description:
      "An AWS-native pipeline built from S3, SQS, ECS Fargate and Lambda. It collects AWS, GitHub and SaaS audit logs, runs Sigma detections, and sends alerts to Slack and GitHub.",
    points: [
      "Deploys with Terraform into your own AWS account",
      "Sigma detection rules, each with tests",
      "Alerts to Slack and GitHub issues",
      "Search in Quickwit and Athena, with Grafana dashboards",
    ],
    guide: GUIDE_LINKS.awsSiemDataFlow,
    repo: "https://github.com/samma-io/aws-siem",
  },
];

const kubernetesCapabilities = [
  {
    icon: FileText,
    title: "YAML-Based Rules",
    description:
      "Each rule names a severity, the NATS subject to publish alerts on, and its compliance mappings. Match on any field with nested and/or logic using equals or regex. Version-control the rule set alongside your infrastructure.",
  },
  {
    icon: Radio,
    title: "NATS Event Streaming",
    description:
      "Fluent Bit and Vector publish cluster logs to NATS. The rule engine subscribes, evaluates every event as it arrives, and publishes matches to per-rule alert subjects.",
  },
  {
    icon: Workflow,
    title: "Vector.dev Pipeline",
    description:
      "Vector formats logs on the way in and acts as the alert sink on the way out. It writes every alert to your storage backend, indexed by severity.",
  },
  {
    icon: BookOpen,
    title: "Elasticsearch or Loki",
    description:
      "Store alerts in Elasticsearch or Loki. Bundled Grafana dashboards break them down by compliance framework and by service.",
  },
];

const awsCapabilities = [
  {
    icon: Database,
    title: "S3 Landing Zones",
    description:
      "AWS and GitHub push logs straight to S3, and an ingester Lambda pulls Slack, 1Password, Google Workspace, GCP and Cloudflare. Every record is kept raw for six years.",
  },
  {
    icon: Filter,
    title: "Vector Filtering",
    description:
      "Vector on ECS parses, filters and normalises each record into one of nine log lanes. SQS carries only S3 events, so any stage can be re-driven from S3.",
  },
  {
    icon: ShieldCheck,
    title: "Sigma Detections",
    description:
      "A stateless Go engine runs Sigma rules, one service per lane. The rules are imported from SigmaHQ or written in-house, and every rule ships with a test.",
  },
  {
    icon: Bell,
    title: "Slack & GitHub Alerts",
    description:
      "Every alert is archived to S3 and then routed by severity and lane: to Slack, and for critical alerts to a GitHub issue.",
  },
  {
    icon: Search,
    title: "Quickwit & Athena Search",
    description:
      "Full-text search over the last 90 days in Quickwit, and SQL over everything in Athena.",
  },
  {
    icon: LayoutDashboard,
    title: "Grafana Dashboards",
    description:
      "Ready-made dashboards over Quickwit and Athena, behind OIDC login.",
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

const comparison = [
  {
    label: "Runs on",
    kubernetes: "Any Kubernetes cluster",
    aws: "Your AWS account (S3, SQS, ECS Fargate, Lambda)",
  },
  {
    label: "Input",
    kubernetes: "Container logs and Kubernetes audit events",
    aws: "CloudTrail, VPC flow, DNS, ALB, GitHub, Slack, 1Password, Google Workspace, GCP, Cloudflare",
  },
  {
    label: "Rules",
    kubernetes: "Samma YAML, compliance-mapped",
    aws: "Sigma, with a test per rule",
  },
  {
    label: "Alerts",
    kubernetes: "NATS → Elasticsearch or Loki → Grafana",
    aws: "S3 archive → Slack → GitHub issues",
  },
  {
    label: "Search",
    kubernetes: "Grafana over Elasticsearch or Loki",
    aws: "Quickwit, Athena and Grafana",
  },
  {
    label: "Install",
    kubernetes: "Helm charts and manifests",
    aws: "Terraform",
  },
];

const guides = [
  {
    title: "The Kubernetes SIEM, and how it fits with the AWS SIEM",
    href: GUIDE_LINKS.kubernetesSiem,
  },
  {
    title: "AWS SIEM: how the data flows",
    href: GUIDE_LINKS.awsSiemDataFlow,
  },
  {
    title: "Deploy your own AWS SIEM",
    href: GUIDE_LINKS.awsSiemDeploy,
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
                Samma SIEM
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
              Rule-Driven Detection,{" "}
              <span className="text-samma-gold">Two Places to Run It</span>
            </h1>
            <p className="text-lg text-gray-300 mb-10 leading-relaxed">
              Run the Kubernetes SIEM inside your cluster, the AWS SIEM in
              your cloud account, or both. Each one turns raw events into
              alerts with rules you keep in git.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#kubernetes">
                <Button variant="primary" size="lg">
                  <Container className="mr-2 h-5 w-5" />
                  Kubernetes SIEM
                </Button>
              </a>
              <a href="#aws">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-samma-navy"
                >
                  <Cloud className="mr-2 h-5 w-5" />
                  AWS SIEM
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Choose your deployment */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Deployment
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each SIEM answers a different question. Pick the one that
              matches where your workloads run. If you run Kubernetes on
              AWS, run both.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {deployments.map((d) => (
              <div
                key={d.id}
                className="border border-gray-200 rounded-lg p-8 flex flex-col hover:shadow-md transition-shadow"
              >
                <d.icon className="h-10 w-10 text-samma-navy mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {d.name}
                </h3>
                <p className="text-samma-navy font-medium mb-4">
                  {d.tagline}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {d.description}
                </p>
                <ul className="space-y-2 mb-8 flex-1">
                  {d.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <ShieldCheck className="h-4 w-4 text-samma-gold mt-0.5 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  <a href={d.guide} target="_blank" rel="noopener noreferrer">
                    <Button variant="primary">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Read the Guide
                    </Button>
                  </a>
                  <a href={d.repo} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <Github className="mr-2 h-4 w-4" />
                      GitHub
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kubernetes SIEM */}
      <section id="kubernetes" className="py-20 bg-samma-lavender scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Container className="h-6 w-6 text-samma-navy" />
              <span className="text-sm font-medium text-samma-navy uppercase tracking-wider">
                Kubernetes SIEM
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Detection Inside Your Cluster
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A Kubernetes-native rule engine that processes cluster events
              through a real-time NATS pipeline, with compliance-aware rules.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {kubernetesCapabilities.map((cap) => (
              <div
                key={cap.title}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
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

          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Compliance Frameworks
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every rule maps to one or more compliance frameworks, so you
              know which standards are covered and where the gaps are.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
            {frameworks.map((fw) => (
              <div
                key={fw.name}
                className={`rounded-lg border p-6 ${fw.color}`}
              >
                <h4 className="text-lg font-bold mb-1">{fw.name}</h4>
                <p className="text-sm opacity-80">{fw.description}</p>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                A Kubernetes Rule
              </h3>
              <p className="text-gray-600">
                Plain YAML: what to match, how severe it is, and where the
                alert goes.
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 text-sm font-mono text-gray-300 overflow-x-auto">
              <pre>{`name: k8s-anonymous-access
description: Detects anonymous or unauthenticated API requests
severity: critical
nats_subject: samma.alerts.k8s.anonymous_access
compliance:
  pci_dss: ["10.2.5", "8.1.2"]
  nist_800_53: ["AC.2", "IA.2"]
  mitre: ["T1078"]
match:
  and:
    - field: kind
      equals: Event
    - field: user.username
      equals: "system:anonymous"`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* AWS SIEM */}
      <section id="aws" className="py-20 bg-white scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Cloud className="h-6 w-6 text-samma-navy" />
              <span className="text-sm font-medium text-samma-navy uppercase tracking-wider">
                AWS SIEM
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Detection Across Your Cloud and SaaS
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              An AWS-native pipeline that follows each log from S3, through
              Sigma detections, to alerts in Slack and GitHub, with search
              over everything.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {awsCapabilities.map((cap) => (
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

          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                A Sigma Rule
              </h3>
              <p className="text-gray-600">
                Standard Sigma, so rules from SigmaHQ work too.
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 text-sm font-mono text-gray-300 overflow-x-auto">
              <pre>{`title: CloudTrail Logging Disabled
level: high
tags:
  - attack.defense_evasion
  - attack.t1562.008
logsource:
  product: aws
  service: cloudtrail
detection:
  selection:
    eventSource: cloudtrail.amazonaws.com
    eventName:
      - StopLogging
      - DeleteTrail
      - UpdateTrail
      - PutEventSelectors
  condition: selection`}</pre>
            </div>
            <p className="mt-6 text-sm text-gray-500 text-center">
              The AWS SIEM is pre-release: there are no published images
              yet, so you build them yourself. The deploy guide walks
              through it.
            </p>
          </div>
        </div>
      </section>

      {/* How they fit together */}
      <section className="py-20 bg-samma-lavender">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Boxes className="h-8 w-8 text-samma-navy mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How They Fit Together
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The Kubernetes SIEM watches the cluster. The AWS SIEM watches
              the account it runs in. Today they run side by side and share
              no data, so you can adopt either one on its own.
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm text-left">
              <thead className="bg-samma-navy text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold" />
                  <th className="px-4 py-3 font-semibold">Kubernetes SIEM</th>
                  <th className="px-4 py-3 font-semibold">AWS SIEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comparison.map((row) => (
                  <tr key={row.label}>
                    <th className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                      {row.label}
                    </th>
                    <td className="px-4 py-3 text-gray-600 min-w-[12rem]">
                      {row.kubernetes}
                    </td>
                    <td className="px-4 py-3 text-gray-600 min-w-[12rem]">
                      {row.aws}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-samma-navy py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Read the Guides
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Hands-on chapters take you from how the data flows to a running
            SIEM.
          </p>
          <ul className="max-w-xl mx-auto mb-10 space-y-3 text-left">
            {guides.map((g) => (
              <li key={g.href}>
                <a
                  href={g.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 rounded-lg border border-samma-navy-light px-5 py-4 text-white hover:bg-samma-navy-light transition-colors"
                >
                  <span>{g.title}</span>
                  <ArrowRight className="h-5 w-5 text-samma-gold shrink-0" />
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={GUIDE_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="primary" size="lg">
                <BookOpen className="mr-2 h-5 w-5" />
                Full Guide
              </Button>
            </a>
            <a href={GITHUB_ORG_URL} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-samma-navy"
              >
                <Github className="mr-2 h-5 w-5" />
                GitHub
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
      </section>
    </div>
  );
}
