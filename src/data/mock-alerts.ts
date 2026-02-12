export interface Alert {
  id: string;
  timestamp: string;
  ruleName: string;
  ruleDescription: string;
  severity: "critical" | "high" | "medium" | "low";
  natsSubject: string;
  source: string;
  compliance: string[];
}

export const mockAlerts: Alert[] = [
  {
    id: "alert-001",
    timestamp: "2025-02-10T16:45:00Z",
    ruleName: "k8s-user-login",
    ruleDescription: "Kubernetes user authentication event detected",
    severity: "medium",
    natsSubject: "samma.alerts.k8s.user_login",
    source: "kube-apiserver",
    compliance: ["PCI-DSS 10.2.5", "MITRE T1078"],
  },
  {
    id: "alert-002",
    timestamp: "2025-02-10T16:30:00Z",
    ruleName: "nmap-open-port",
    ruleDescription: "New open port detected on 10.0.1.22:3306",
    severity: "medium",
    natsSubject: "samma.alerts.nmap.port",
    source: "nmap-scanner",
    compliance: ["PCI-DSS 11.4", "MITRE T1046"],
  },
  {
    id: "alert-003",
    timestamp: "2025-02-10T15:22:00Z",
    ruleName: "nikto-critical-finding",
    ruleDescription: "Nikto found OSVDB-3092 on app.samma.io",
    severity: "high",
    natsSubject: "samma.alerts.nikto.critical",
    source: "nikto-scanner",
    compliance: ["PCI-DSS 6.5", "MITRE T1190"],
  },
  {
    id: "alert-004",
    timestamp: "2025-02-10T13:42:00Z",
    ruleName: "ssh-brute-force",
    ruleDescription: "12 failed SSH attempts from 192.168.1.100",
    severity: "high",
    natsSubject: "samma.alerts.ssh.bruteforce",
    source: "vector-sshd",
    compliance: ["PCI-DSS 10.2.4", "MITRE T1110"],
  },
  {
    id: "alert-005",
    timestamp: "2025-02-10T11:15:00Z",
    ruleName: "k8s-privilege-escalation",
    ruleDescription: "ClusterRoleBinding created by user deploy-bot",
    severity: "critical",
    natsSubject: "samma.alerts.k8s.privesc",
    source: "kube-apiserver",
    compliance: ["PCI-DSS 10.2.2", "MITRE T1548", "HIPAA 164.312.a.1"],
  },
  {
    id: "alert-006",
    timestamp: "2025-02-10T08:30:00Z",
    ruleName: "container-escape-attempt",
    ruleDescription: "Privileged container launched in namespace prod",
    severity: "critical",
    natsSubject: "samma.alerts.k8s.container_escape",
    source: "kube-apiserver",
    compliance: ["PCI-DSS 6.5.6", "MITRE T1611"],
  },
  {
    id: "alert-007",
    timestamp: "2025-02-10T07:15:00Z",
    ruleName: "nmap-open-port",
    ruleDescription: "Port 8080 open on 10.0.1.30 - HTTP proxy detected",
    severity: "medium",
    natsSubject: "samma.alerts.nmap.port",
    source: "nmap-scanner",
    compliance: ["PCI-DSS 11.4", "MITRE T1046"],
  },
  {
    id: "alert-008",
    timestamp: "2025-02-10T05:00:00Z",
    ruleName: "k8s-user-login",
    ruleDescription: "Service account default:kubernetes-admin authenticated",
    severity: "medium",
    natsSubject: "samma.alerts.k8s.user_login",
    source: "kube-apiserver",
    compliance: ["PCI-DSS 10.2.5", "MITRE T1078"],
  },
];
