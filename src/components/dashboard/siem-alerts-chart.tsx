"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyAlerts } from "@/data/mock-siem";

// Same order and colours as the severity tiles.
const SERIES = [
  { key: "critical", label: "Critical", color: "#DC2626" },
  { key: "high", label: "High", color: "#EA580C" },
  { key: "medium", label: "Medium", color: "#F59E0B" },
  { key: "low", label: "Low", color: "#22C55E" },
] as const;

/** Alerts per day, stacked by level. */
export function SiemAlertsChart({ daily }: { daily: DailyAlerts[] }) {
  const data = daily.map((d) => ({ ...d, label: d.day.slice(5) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: "#F3F4F6" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        {SERIES.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
