export interface LogSource {
  id: string;
  name: string;
  type: "vector" | "filebeat" | "nats" | "kubernetes" | "scanner";
  status: "connected" | "disconnected" | "error";
  eventsPerMinute: number;
  description: string;
}

export interface AlertDestination {
  id: string;
  name: string;
  type: "nats" | "elasticsearch" | "slack" | "webhook" | "grafana";
  status: "active" | "inactive" | "error";
  alertsSent24h: number;
}

export const mockLogSources: LogSource[] = [
  {
    id: "src-001",
    name: "Kubernetes Audit Log",
    type: "kubernetes",
    status: "connected",
    eventsPerMinute: 245,
    description: "K8s API server audit logs via Vector",
  },
  {
    id: "src-002",
    name: "Vector Pipeline",
    type: "vector",
    status: "connected",
    eventsPerMinute: 1820,
    description: "Main log aggregation pipeline (vector.dev)",
  },
  {
    id: "src-003",
    name: "NATS Event Bus",
    type: "nats",
    status: "connected",
    eventsPerMinute: 530,
    description: "NATS JetStream for scanner events",
  },
  {
    id: "src-004",
    name: "Filebeat System Logs",
    type: "filebeat",
    status: "connected",
    eventsPerMinute: 92,
    description: "System logs from worker nodes",
  },
  {
    id: "src-005",
    name: "Scanner Output Feed",
    type: "scanner",
    status: "connected",
    eventsPerMinute: 15,
    description: "Aggregated output from all Samma scanners",
  },
  {
    id: "src-006",
    name: "Legacy Syslog",
    type: "vector",
    status: "disconnected",
    eventsPerMinute: 0,
    description: "Deprecated syslog input - migrating to Vector",
  },
];

export const mockAlertDestinations: AlertDestination[] = [
  {
    id: "dst-001",
    name: "NATS Alerts Stream",
    type: "nats",
    status: "active",
    alertsSent24h: 270,
  },
  {
    id: "dst-002",
    name: "Elasticsearch",
    type: "elasticsearch",
    status: "active",
    alertsSent24h: 270,
  },
  {
    id: "dst-003",
    name: "Slack #security-alerts",
    type: "slack",
    status: "active",
    alertsSent24h: 32,
  },
  {
    id: "dst-004",
    name: "PagerDuty Webhook",
    type: "webhook",
    status: "active",
    alertsSent24h: 4,
  },
  {
    id: "dst-005",
    name: "Grafana Annotations",
    type: "grafana",
    status: "active",
    alertsSent24h: 270,
  },
];
