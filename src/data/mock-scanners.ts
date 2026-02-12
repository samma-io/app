export type ScannerType = "nmap" | "nikto" | "tsunami" | "dnsrecon";
export type ScannerStatus = "running" | "idle" | "error" | "completed";

export interface Scanner {
  id: string;
  name: string;
  type: ScannerType;
  description: string;
  status: ScannerStatus;
  target: string;
  lastRun: string;
  nextRun: string;
  schedule: string;
  findings: number;
  tags: string[];
}

export const mockScanners: Scanner[] = [
  {
    id: "scan-001",
    name: "Production Port Scanner",
    type: "nmap",
    description: "TCP SYN port scan of production subnet",
    status: "completed",
    target: "10.0.1.0/24",
    lastRun: "2025-02-10T14:30:00Z",
    nextRun: "2025-02-11T14:30:00Z",
    schedule: "Daily at 14:30 UTC",
    findings: 23,
    tags: ["production", "network"],
  },
  {
    id: "scan-002",
    name: "Web App Vulnerability Scanner",
    type: "nikto",
    description: "Web server vulnerability scan with OSVDB checks",
    status: "running",
    target: "app.samma.io",
    lastRun: "2025-02-10T16:00:00Z",
    nextRun: "2025-02-10T22:00:00Z",
    schedule: "Every 6 hours",
    findings: 7,
    tags: ["webapp", "production"],
  },
  {
    id: "scan-003",
    name: "Tsunami Security Scanner",
    type: "tsunami",
    description: "Network security scanner with plugin-based detection",
    status: "idle",
    target: "10.0.2.0/24",
    lastRun: "2025-02-09T08:00:00Z",
    nextRun: "2025-02-12T08:00:00Z",
    schedule: "Every 3 days",
    findings: 4,
    tags: ["staging", "deep-scan"],
  },
  {
    id: "scan-004",
    name: "DNS Reconnaissance",
    type: "dnsrecon",
    description: "DNS enumeration and zone transfer testing",
    status: "completed",
    target: "samma.io",
    lastRun: "2025-02-10T12:00:00Z",
    nextRun: "2025-02-11T12:00:00Z",
    schedule: "Daily at 12:00 UTC",
    findings: 12,
    tags: ["dns", "recon"],
  },
  {
    id: "scan-005",
    name: "TLS Cipher Audit",
    type: "nmap",
    description: "TLS cipher suite enumeration on port 443",
    status: "error",
    target: "*.samma.io",
    lastRun: "2025-02-10T10:00:00Z",
    nextRun: "2025-02-10T16:00:00Z",
    schedule: "Every 6 hours",
    findings: 0,
    tags: ["tls", "compliance"],
  },
  {
    id: "scan-006",
    name: "Staging Web Scanner",
    type: "nikto",
    description: "Nikto scan against staging environment",
    status: "completed",
    target: "staging.samma.io",
    lastRun: "2025-02-10T09:00:00Z",
    nextRun: "2025-02-11T09:00:00Z",
    schedule: "Daily at 09:00 UTC",
    findings: 3,
    tags: ["staging", "webapp"],
  },
];
