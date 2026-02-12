import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function severityColor(severity: string): string {
  const map: Record<string, string> = {
    critical: "bg-severity-critical text-white",
    high: "bg-severity-high text-white",
    medium: "bg-severity-medium text-black",
    low: "bg-severity-low text-white",
    info: "bg-severity-info text-white",
  };
  return map[severity] || "bg-gray-200 text-gray-800";
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    running: "bg-green-100 text-green-800",
    idle: "bg-gray-100 text-gray-600",
    error: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
    connected: "bg-green-100 text-green-800",
    disconnected: "bg-gray-100 text-gray-600",
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-600",
  };
  return map[status] || "bg-gray-200 text-gray-800";
}
