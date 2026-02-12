import {
  Radar,
  Play,
  AlertTriangle,
  Target,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockScanners } from "@/data/mock-scanners";
import { mockScanResults } from "@/data/mock-scan-results";
import { formatDate, severityColor, statusColor } from "@/lib/utils";
import { SCANNER_TYPES } from "@/lib/constants";

const uniqueTargets = [...new Set(mockScanners.map((s) => s.target))];
const totalFindings = mockScanners.reduce((sum, s) => sum + s.findings, 0);
const runningCount = mockScanners.filter((s) => s.status === "running").length;

export default function ProfileScannersPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-samma-navy text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">Scanners Dashboard</h1>
          <p className="text-gray-300">
            Manage and monitor your security scanners across all targets.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Scanners"
            value={mockScanners.length}
            icon={Radar}
          />
          <StatCard
            label="Currently Running"
            value={runningCount}
            icon={Play}
          />
          <StatCard
            label="Total Findings"
            value={totalFindings}
            icon={AlertTriangle}
          />
          <StatCard
            label="Targets Monitored"
            value={uniqueTargets.length}
            icon={Target}
          />
        </div>

        {/* Scanner Cards */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Active Scanners
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockScanners.map((scanner) => {
              const typeInfo =
                SCANNER_TYPES[scanner.type] || SCANNER_TYPES.nmap;
              return (
                <Card key={scanner.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {scanner.name}
                      </h3>
                      <Badge variant={statusColor(scanner.status)}>
                        {scanner.status === "running" && (
                          <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500 inline-block animate-pulse" />
                        )}
                        {scanner.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                        {scanner.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="bg-gray-100 text-gray-600"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">
                        {scanner.description}
                      </p>
                      <div className="text-sm space-y-1 text-gray-500">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span className="font-mono">{scanner.target}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{scanner.schedule}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-sm text-gray-500">
                          Last: {formatDate(scanner.lastRun)}
                        </span>
                        <div className="flex items-center gap-1 text-sm font-medium text-samma-navy">
                          <AlertTriangle className="h-4 w-4" />
                          {scanner.findings} findings
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Scan Results Table */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Scan Results
          </h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Time
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Scanner
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Target
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Severity
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Finding
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockScanResults.map((result) => (
                    <tr
                      key={result.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(result.timestamp)}
                      </td>
                      <td className="px-6 py-3">
                        <Badge
                          variant={
                            SCANNER_TYPES[result.scannerType]?.color ||
                            "bg-gray-100 text-gray-600"
                          }
                        >
                          {result.scannerType}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 font-mono text-gray-700">
                        {result.target}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={severityColor(result.severity)}>
                          {result.severity}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-gray-700 max-w-md truncate">
                        {result.finding}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Targets */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Monitored Targets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueTargets.map((target) => {
              const scanners = mockScanners.filter(
                (s) => s.target === target
              );
              const findings = scanners.reduce(
                (sum, s) => sum + s.findings,
                0
              );
              return (
                <Card key={target}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono font-medium text-gray-900">
                          {target}
                        </p>
                        <p className="text-sm text-gray-500">
                          {scanners.length} scanner
                          {scanners.length !== 1 ? "s" : ""} &middot;{" "}
                          {findings} findings
                        </p>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-gray-400" />
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
