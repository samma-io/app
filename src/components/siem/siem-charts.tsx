"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Alert } from "@/data/mock-alerts";
import type { SiemRule } from "@/data/mock-siem-rules";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#DC2626",
  high: "#EA580C",
  medium: "#F59E0B",
  low: "#22C55E",
};

interface SiemChartsProps {
  alerts: Alert[];
  rules: SiemRule[];
}

export default function SiemCharts({ alerts, rules }: SiemChartsProps) {
  // Severity distribution from rules
  const severityData = Object.entries(
    rules.reduce<Record<string, number>>((acc, rule) => {
      acc[rule.severity] = (acc[rule.severity] || 0) + rule.matchCount24h;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Alerts over time (mock hourly data)
  const hoursData = Array.from({ length: 12 }, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - (11 - i));
    return {
      hour: `${hour.getHours().toString().padStart(2, "0")}:00`,
      critical: Math.floor(Math.random() * 3),
      high: Math.floor(Math.random() * 8) + 1,
      medium: Math.floor(Math.random() * 15) + 5,
      low: Math.floor(Math.random() * 10) + 2,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Severity Distribution */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">
            Severity Distribution (24h)
          </h3>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {severityData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={SEVERITY_COLORS[entry.name] || "#9CA3AF"}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alerts Over Time */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Alerts Over Time</h3>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hoursData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="critical"
                stackId="a"
                fill={SEVERITY_COLORS.critical}
              />
              <Bar dataKey="high" stackId="a" fill={SEVERITY_COLORS.high} />
              <Bar
                dataKey="medium"
                stackId="a"
                fill={SEVERITY_COLORS.medium}
              />
              <Bar dataKey="low" stackId="a" fill={SEVERITY_COLORS.low} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
