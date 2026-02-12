import { Github, ExternalLink, MapPin, Code2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

const tools = [
  { name: "Kubernetes", role: "Orchestration platform" },
  { name: "Docker", role: "Container runtime" },
  { name: "NATS", role: "Message streaming" },
  { name: "Elasticsearch", role: "Event storage & search" },
  { name: "Grafana", role: "Metrics & dashboards" },
  { name: "Kibana", role: "Log analysis & dashboards" },
  { name: "Vector.dev", role: "Log pipeline" },
  { name: "Helm", role: "Deployment & packaging" },
  { name: "Nmap", role: "Network scanning" },
  { name: "Nikto", role: "Web vulnerability scanning" },
  { name: "Tsunami", role: "Security scanning" },
  { name: "DNSRecon", role: "DNS reconnaissance" },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-samma-navy to-samma-navy-dark text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="h-5 w-5 text-samma-gold" />
              <span className="text-sm font-medium text-samma-gold uppercase tracking-wider">
                Built in Sweden
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
              About Samma.io
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed">
              Samma is an open-source, Kubernetes-native security scanning
              platform built in Sweden. We believe security tooling should be
              transparent, composable, and built on standards the industry
              already trusts.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              Security scanning shouldn&apos;t require proprietary black boxes.
              Samma combines proven, industry-standard tools into an automated
              pipeline that runs inside your cluster. Every component is open
              source, every scanner is a tool you already know, and every
              result flows to dashboards you already use.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              We don&apos;t build dashboards to lock you in. Samma produces
              structured data that works with Grafana, Kibana, or any tool
              your team prefers. The platform does the scanning and
              processing &mdash; you choose how to visualize it.
            </p>
          </div>
        </div>
      </section>

      {/* Open Source */}
      <section className="py-20 bg-samma-lavender">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Code2 className="h-6 w-6 text-samma-navy" />
                  <h2 className="text-3xl font-bold text-gray-900">
                    Fully Open Source
                  </h2>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Every line of Samma is open source. The Kubernetes operator,
                  the SIEM rule engine, the scanner orchestration, and all
                  configuration &mdash; it&apos;s all on GitHub.
                </p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  No vendor lock-in, no proprietary agents, no phone-home
                  telemetry. Fork it, extend it, contribute back. Security
                  tooling works best when the community can audit and improve
                  it.
                </p>
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
              </div>
              <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  What&apos;s in the repo
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-samma-gold mt-2 flex-shrink-0" />
                    <span>Kubernetes operator (Go) for target discovery and scan scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-samma-gold mt-2 flex-shrink-0" />
                    <span>SIEM rule engine with YAML-based detection rules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-samma-gold mt-2 flex-shrink-0" />
                    <span>Scanner containers (Nmap, Nikto, Tsunami, DNSRecon)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-samma-gold mt-2 flex-shrink-0" />
                    <span>Helm charts for one-command deployment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-samma-gold mt-2 flex-shrink-0" />
                    <span>Pre-built Grafana and Kibana dashboards</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industry-Standard Tools */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Wrench className="h-6 w-6 text-samma-navy" />
              <h2 className="text-3xl font-bold text-gray-900">
                Industry-Standard Tools Only
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              No proprietary components. Samma is built entirely on tools the
              industry already knows, trusts, and maintains.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {tools.map((tool) => (
              <div
                key={tool.name}
                className="border border-gray-200 rounded-lg p-4 text-center hover:shadow-sm transition-shadow"
              >
                <p className="font-semibold text-gray-900">{tool.name}</p>
                <p className="text-xs text-gray-500 mt-1">{tool.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built in Sweden + CTA */}
      <section className="bg-samma-navy py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <MapPin className="h-8 w-8 text-samma-gold mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Built in Sweden</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
            Samma is designed and developed in Sweden. We care about privacy,
            transparency, and building tools that respect the people who use
            them.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
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
            <a
              href="https://samma.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-samma-navy"
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                Documentation
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
