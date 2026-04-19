import Link from "next/link";
import {
  Shield,
  Radar,
  Clock,
  FileText,
  Radio,
  LayoutDashboard,
  ArrowRight,
  Search,
  Bell,
  MapPin,
  Github,
  Network,
  Globe,
  Lock,
  Zap,
  Server,
  ChevronRight,
  Terminal,
  Cpu,
  CloudUpload,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Radar,
    title: "Auto-Discovery",
    description:
      "The operator continuously watches your Kubernetes cluster and registers new services as scan targets — no manual configuration needed.",
  },
  {
    icon: Clock,
    title: "Scheduled Scans",
    description:
      "Cron-based scheduling with Nmap, Nikto, Tsunami, DNSRecon, and more. Scans trigger automatically on target discovery and follow your schedule.",
  },
  {
    icon: FileText,
    title: "SIEM Rule Engine",
    description:
      "YAML-based rules with compliance mappings for PCI-DSS, GDPR, HIPAA, NIST, and MITRE ATT&CK frameworks.",
  },
  {
    icon: Radio,
    title: "NATS Integration",
    description:
      "Real-time event processing via NATS message bus. Scanner results and security events flow through a unified pipeline.",
  },
  {
    icon: CloudUpload,
    title: "External Scanning",
    description:
      "Run the operator in your local cluster and forward external targets to Samma.io for cloud-hosted scanning — bridging internal and internet-facing assets.",
  },
  {
    icon: LayoutDashboard,
    title: "Your Dashboards",
    description:
      "Samma feeds data to Grafana, Kibana, or any tool you already use. We provide the pipeline — you choose the visualization.",
  },
];

const scanners = [
  {
    icon: Network,
    name: "Nmap",
    description: "Port scanning and service/version detection across your entire attack surface.",
  },
  {
    icon: Globe,
    name: "Nikto",
    description: "Web server vulnerability scanning — identifies misconfigs, outdated software, and dangerous files.",
  },
  {
    icon: Zap,
    name: "Tsunami",
    description: "Google's open-source network security scanner with a plugin system for high-severity findings.",
  },
  {
    icon: Search,
    name: "DNSRecon",
    description: "DNS enumeration, zone-transfer attempts, and subdomain discovery.",
  },
  {
    icon: Shield,
    name: "HTTP Headers",
    description: "Checks for missing or misconfigured security headers: HSTS, CSP, X-Frame-Options, and more.",
  },
  {
    icon: Lock,
    name: "TLS Inspector",
    description: "Validates certificates, cipher suites, protocol versions, and expiry dates.",
  },
];

const steps = [
  {
    icon: Server,
    title: "Deploy",
    description:
      "Install the Samma operator in your Kubernetes cluster with a single kubectl command. Works on local Kind/Minikube or production EKS/GKE.",
  },
  {
    icon: Radar,
    title: "Discover & Scan",
    description:
      "The operator auto-discovers services and forwards targets to Samma.io. All six scanners run on schedule, producing structured JSON output.",
  },
  {
    icon: Bell,
    title: "Analyze & Alert",
    description:
      "The SIEM rule engine processes findings through NATS and sends alerts to your dashboards, SIEM, or any webhook destination.",
  },
];

const installSteps = [
  {
    step: "1",
    title: "Install the operator",
    code: "kubectl apply -f https://github.com/samma-io/operator/releases/latest/download/operator.yaml",
  },
  {
    step: "2",
    title: "Create an API token",
    code: "# Go to Samma.io → Dashboard → Tokens → New Token",
  },
  {
    step: "3",
    title: "Configure the operator secret",
    code: `kubectl create secret generic samma-api \\
  --namespace samma-system \\
  --from-literal=api-token=<your-token> \\
  --from-literal=api-url=https://app.samma.io`,
  },
  {
    step: "4",
    title: "Apply a scan target",
    code: `apiVersion: samma.io/v1
kind: ScanTarget
metadata:
  name: my-web-app
spec:
  host: my-service.example.com
  profile: full`,
  },
];

const techBadges = [
  "Kubernetes",
  "Docker",
  "Go",
  "Python",
  "NATS",
  "Vector.dev",
  "Elasticsearch",
  "Grafana",
  "Kibana",
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-samma-navy to-samma-navy-dark text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-samma-gold" />
                <span className="text-sm font-medium text-samma-gold uppercase tracking-wider">
                  Security Scanner Platform
                </span>
              </div>
              <span className="text-gray-500">|</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">Built in Sweden</span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Scan Anything.{" "}
              <span className="text-samma-gold">From Anywhere.</span>
              <br />
              Secure Everything.
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed">
              Deploy the Samma operator in your Kubernetes cluster — it
              auto-discovers your services and orchestrates six security
              scanners. Run it locally, forward external targets to Samma.io,
              or both. From discovery to alert, fully automated.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#install">
                <Button variant="primary" size="lg">
                  Install Operator
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <Link href="/scanners">
                <Button variant="white" size="lg">
                  View Scanners
                </Button>
              </Link>
              <Link href="/siem">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/40 text-white hover:bg-white/10"
                >
                  Explore SIEM
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-samma-lavender py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Samma.io?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A complete security scanning platform: automated discovery,
              multi-scanner orchestration, external target forwarding, and
              real-time event processing.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-lg p-6 border-l-4 border-samma-navy shadow-sm hover:shadow-md transition-shadow"
              >
                <feature.icon className="h-10 w-10 text-samma-navy mb-4" />
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

      {/* Scanners Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Cpu className="h-10 w-10 text-samma-navy mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Six Scanners. One Platform.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              All scanners run as containerized jobs, fully orchestrated by the
              Samma operator. Each produces structured JSON output that flows
              through the SIEM pipeline.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scanners.map((scanner) => (
              <div
                key={scanner.name}
                className="flex gap-4 p-6 rounded-lg border border-gray-200 hover:border-samma-navy hover:shadow-sm transition-all"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-samma-lavender flex items-center justify-center">
                    <scanner.icon className="h-5 w-5 text-samma-navy" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {scanner.name}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {scanner.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Operator Section */}
      <section className="py-20 bg-samma-lavender">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Server className="h-6 w-6 text-samma-navy" />
                <span className="text-sm font-semibold text-samma-navy uppercase tracking-wider">
                  Kubernetes Operator
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Run locally. Scan globally.
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Deploy the Samma operator in <strong>any Kubernetes cluster</strong> — a local Kind or Minikube setup, your staging environment, or production EKS/GKE. The operator watches for services and automatically registers them as scan targets.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Want to scan external internet-facing assets? The operator can forward targets to <strong>Samma.io</strong> for cloud-hosted scanning. Your cluster stays private — only target hostnames or IPs are forwarded.
              </p>
              <div className="space-y-3">
                {[
                  "Auto-discover all services in your cluster",
                  "Forward external targets to Samma.io",
                  "Works with Kind, Minikube, EKS, GKE, AKS",
                  "Configurable scan profiles per target",
                ].map((point) => (
                  <div key={point} className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-samma-navy flex-shrink-0" />
                    <span className="text-gray-700">{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-samma-navy rounded-xl p-6 text-white font-mono text-sm">
              <div className="flex items-center gap-2 mb-4 opacity-60">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs ml-2">target.yaml</span>
              </div>
              <pre className="leading-relaxed text-gray-200 overflow-x-auto whitespace-pre">{`apiVersion: samma.io/v1
kind: ScanTarget
metadata:
  name: external-web
  namespace: samma-system
spec:
  # Send to Samma.io for
  # cloud-hosted scanning
  host: www.example.com
  profile: full
  externalScan: true`}</pre>
              <div className="mt-6 pt-4 border-t border-white/20">
                <p className="text-xs text-gray-400">
                  The operator picks this up, registers the target in Samma.io,
                  and all six scanners run on schedule.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Install Guide */}
      <section id="install" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Terminal className="h-10 w-10 text-samma-navy mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Up and running in minutes
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Four steps from a fresh cluster to automated security scanning.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {installSteps.map((item) => (
              <div
                key={item.step}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-samma-navy text-white flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto whitespace-pre font-mono leading-relaxed">
                    {item.code}
                  </pre>
                </div>
              </div>
            ))}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-samma-gold text-samma-navy flex items-center justify-center text-sm font-bold">
                5
              </div>
              <div className="flex-1 flex items-center">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    View your results
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Scan findings appear in your{" "}
                    <Link
                      href="/dashboard"
                      className="text-samma-navy font-medium underline underline-offset-2"
                    >
                      Samma.io dashboard
                    </Link>{" "}
                    in real time, and are forwarded to your SIEM pipeline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Three steps from deployment to actionable security insights.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-samma-navy text-white mb-6">
                  <step.icon className="h-8 w-8" />
                </div>
                <div className="text-sm font-medium text-samma-gold mb-2">
                  Step {i + 1}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-16 flex flex-wrap justify-center gap-3">
            {techBadges.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Philosophy */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <LayoutDashboard className="h-10 w-10 text-samma-navy mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Use your own dashboards
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              Samma doesn&apos;t try to replace your existing tools. All scan
              results and security events are published as structured data to
              Elasticsearch via NATS and Vector.dev.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Use <strong>Grafana</strong>, <strong>Kibana</strong>, or any
              visualization tool your team already knows. We provide pre-built
              dashboard templates to get you started, but the data is yours to
              query however you like.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {["Grafana", "Kibana", "Elasticsearch", "NATS", "Vector.dev"].map(
                (tool) => (
                  <span
                    key={tool}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium"
                  >
                    {tool}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-samma-navy py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to secure your cluster?
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Install the operator, point it at your cluster, and have automated
            security scanning running in minutes. Open source, Kubernetes-native,
            and fully extensible.
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
            <a href="#install">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-samma-navy"
              >
                Install Guide
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
