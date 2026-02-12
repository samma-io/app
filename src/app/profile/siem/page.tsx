import {
  FileText,
  Bell,
  Database,
  Send,
  ShieldCheck,
  Radio,
  Activity,
  Server,
  Scan,
  Wifi,
  WifiOff,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockSiemRules } from "@/data/mock-siem-rules";
import { mockAlerts } from "@/data/mock-alerts";
import {
  mockLogSources,
  mockAlertDestinations,
} from "@/data/mock-log-sources";
import { formatDate, severityColor } from "@/lib/utils";
import SiemCharts from "@/components/siem/siem-charts";

const activeRules = mockSiemRules.filter((r) => r.enabled).length;
const totalAlerts24h = mockSiemRules.reduce(
  (sum, r) => sum + r.matchCount24h,
  0
);
const connectedSources = mockLogSources.filter(
  (s) => s.status === "connected"
).length;
const activeDestinations = mockAlertDestinations.filter(
  (d) => d.status === "active"
).length;

const complianceColors: Record<string, string> = {
  pciDss: "bg-blue-100 text-blue-800",
  gdpr: "bg-green-100 text-green-800",
  hipaa: "bg-red-100 text-red-800",
  nist80053: "bg-purple-100 text-purple-800",
  mitre: "bg-orange-100 text-orange-800",
};

const complianceLabels: Record<string, string> = {
  pciDss: "PCI-DSS",
  gdpr: "GDPR",
  hipaa: "HIPAA",
  nist80053: "NIST 800-53",
  mitre: "MITRE ATT&CK",
};

const sourceIcons: Record<string, typeof Database> = {
  vector: Activity,
  filebeat: Server,
  nats: Radio,
  kubernetes: ShieldCheck,
  scanner: Scan,
};

export default function ProfileSiemPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-samma-navy text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">SIEM Dashboard</h1>
          <p className="text-gray-300">
            Rule engine, log sources, alerts, and compliance monitoring.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Rules" value={activeRules} icon={FileText} />
          <StatCard label="Alerts (24h)" value={totalAlerts24h} icon={Bell} />
          <StatCard
            label="Log Sources"
            value={connectedSources}
            icon={Database}
          />
          <StatCard
            label="Destinations"
            value={activeDestinations}
            icon={Send}
          />
        </div>

        {/* Charts */}
        <SiemCharts alerts={mockAlerts} rules={mockSiemRules} />

        {/* SIEM Rules */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            SIEM Rules
          </h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Rule
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Severity
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      NATS Subject
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Matches (24h)
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Compliance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockSiemRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block h-3 w-3 rounded-full ${
                            rule.enabled ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {rule.name}
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {rule.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={severityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-gray-600">
                        {rule.natsSubject}
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {rule.matchCount24h}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(rule.compliance).map(
                            ([key, values]) =>
                              values &&
                              values.length > 0 && (
                                <Badge
                                  key={key}
                                  variant={
                                    complianceColors[key] ||
                                    "bg-gray-100 text-gray-600"
                                  }
                                >
                                  {complianceLabels[key] || key}
                                </Badge>
                              )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Log Sources & Destinations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Log Sources */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Log Sources
            </h2>
            <div className="space-y-3">
              {mockLogSources.map((source) => {
                const Icon = sourceIcons[source.type] || Database;
                return (
                  <Card key={source.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-samma-lavender p-2.5">
                          <Icon className="h-5 w-5 text-samma-navy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {source.name}
                            </p>
                            {source.status === "connected" ? (
                              <Wifi className="h-4 w-4 text-green-500" />
                            ) : (
                              <WifiOff className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {source.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {source.eventsPerMinute}
                          </p>
                          <p className="text-xs text-gray-500">events/min</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Alert Destinations */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Alert Destinations
            </h2>
            <div className="space-y-3">
              {mockAlertDestinations.map((dest) => (
                <Card key={dest.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-samma-lavender p-2.5">
                        <Send className="h-5 w-5 text-samma-navy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {dest.name}
                          </p>
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              dest.status === "active"
                                ? "bg-green-500"
                                : dest.status === "error"
                                ? "bg-red-500"
                                : "bg-gray-300"
                            }`}
                          />
                        </div>
                        <p className="text-xs text-gray-500 capitalize">
                          {dest.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {dest.alertsSent24h}
                        </p>
                        <p className="text-xs text-gray-500">sent (24h)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Alerts Timeline */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Alerts
          </h2>
          <div className="space-y-3">
            {mockAlerts.map((alert) => {
              const borderColor =
                alert.severity === "critical"
                  ? "border-l-severity-critical"
                  : alert.severity === "high"
                  ? "border-l-severity-high"
                  : alert.severity === "medium"
                  ? "border-l-severity-medium"
                  : "border-l-severity-low";

              return (
                <Card key={alert.id} className={`border-l-4 ${borderColor}`}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={severityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <span className="font-medium text-gray-900">
                            {alert.ruleName}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {alert.ruleDescription}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {alert.compliance.map((c) => (
                            <span
                              key={c}
                              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className="text-sm text-gray-500">
                          {formatDate(alert.timestamp)}
                        </p>
                        <p className="text-xs text-gray-400 font-mono mt-1">
                          {alert.source}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
