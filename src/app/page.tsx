import Link from "next/link";
import {
  Shield,
  Radar,
  Clock,
  FileText,
  Radio,
  LayoutDashboard,
  Boxes,
  ArrowRight,
  Search,
  Bell,
  MapPin,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Radar,
    title: "Auto-Detection",
    description:
      "Automatically discovers scan targets in your Kubernetes cluster. The operator maintains an updated inventory so you never miss a new service.",
  },
  {
    icon: Clock,
    title: "Scheduled Scans",
    description:
      "Cron-based scheduling with Nmap, Nikto, Tsunami, and DNSRecon. Scans trigger on new target discovery and follow your schedule.",
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
    icon: LayoutDashboard,
    title: "Your Dashboards",
    description:
      "Samma feeds data to Grafana, Kibana, or any tool you already use. We provide the pipeline — you choose the visualization.",
  },
  {
    icon: Boxes,
    title: "Multi-Scanner",
    description:
      "Nmap, Nikto, Tsunami, DNSRecon — all containerized and orchestrated. Add third-party scanners like PCI DSS or TLS testers.",
  },
];

const steps = [
  {
    icon: Search,
    title: "Detect",
    description:
      "Samma auto-discovers targets in your Kubernetes cluster and maintains an up-to-date inventory.",
  },
  {
    icon: Radar,
    title: "Scan",
    description:
      "Dockerized scanners run on schedule, producing structured JSON output for every finding.",
  },
  {
    icon: Bell,
    title: "Analyze",
    description:
      "The SIEM rule engine processes events through NATS and sends alerts to any destination.",
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
                  Security Scanner Manager
                </span>
              </div>
              <span className="text-gray-500">|</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">
                  Built in Sweden
                </span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Automated Security Scanning for{" "}
              <span className="text-samma-gold">Kubernetes</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed">
              Auto-detect targets, run scheduled scans with industry-standard
              tools, and process security events with an integrated SIEM rule
              engine. From discovery to alert, fully automated.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/scanners">
                <Button variant="primary" size="lg">
                  View Scanners
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/siem">
                <Button variant="white" size="lg">
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
              A complete security scanning platform that combines automated
              discovery, multi-scanner orchestration, and real-time event
              processing.
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

      {/* How It Works */}
      <section className="py-20 bg-white">
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
          {/* Tech badges */}
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
      <section className="py-20 bg-gray-50">
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
            Get started with Samma.io and have automated security scanning
            running in minutes. Open source, Kubernetes-native, and fully
            extensible.
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
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
