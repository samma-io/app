export interface ComplianceMapping {
  pciDss?: string[];
  gdpr?: string[];
  hipaa?: string[];
  nist80053?: string[];
  mitre?: string[];
}

export interface SiemRule {
  id: string;
  name: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  natsSubject: string;
  compliance: ComplianceMapping;
  matchCondition: string;
  enabled: boolean;
  matchCount24h: number;
  lastTriggered: string;
}

export const mockSiemRules: SiemRule[] = [
  {
    id: "rule-001",
    name: "k8s-user-login",
    description: "Alerts on Kubernetes user authentication events",
    severity: "medium",
    natsSubject: "samma.alerts.k8s.user_login",
    compliance: {
      pciDss: ["10.2.5"],
      gdpr: ["IV_35.7.d", "IV_32.2"],
      hipaa: ["164.312.b"],
      nist80053: ["AU.14", "AC.7"],
      mitre: ["T1078"],
    },
    matchCondition:
      "kind=Event AND objectRef.resource=users AND verb=authenticate",
    enabled: true,
    matchCount24h: 142,
    lastTriggered: "2025-02-10T16:45:00Z",
  },
  {
    id: "rule-002",
    name: "nikto-critical-finding",
    description: "Matches Nikto findings with known OSVDB vulnerabilities",
    severity: "high",
    natsSubject: "samma.alerts.nikto.critical",
    compliance: {
      pciDss: ["6.5", "11.4"],
      nist80053: ["SI.4"],
      mitre: ["T1190"],
    },
    matchCondition: 'type=Nikto AND OSVDB matches "^OSVDB-[1-9]"',
    enabled: true,
    matchCount24h: 7,
    lastTriggered: "2025-02-10T15:22:00Z",
  },
  {
    id: "rule-003",
    name: "nmap-open-port",
    description: "Matches nmap port scan results for open TCP ports",
    severity: "medium",
    natsSubject: "samma.alerts.nmap.port",
    compliance: {
      pciDss: ["11.4"],
      nist80053: ["SI.4"],
      mitre: ["T1046"],
    },
    matchCondition: "type=nmap AND scanner=nmap_port AND protocol=tcp",
    enabled: true,
    matchCount24h: 89,
    lastTriggered: "2025-02-10T14:30:00Z",
  },
  {
    id: "rule-004",
    name: "k8s-privilege-escalation",
    description: "Detects attempts to escalate privileges in Kubernetes",
    severity: "critical",
    natsSubject: "samma.alerts.k8s.privesc",
    compliance: {
      pciDss: ["10.2.2"],
      hipaa: ["164.312.a.1"],
      nist80053: ["AC.6", "AU.12"],
      mitre: ["T1078.001", "T1548"],
    },
    matchCondition:
      "kind=Event AND verb=create AND objectRef.resource=clusterrolebindings",
    enabled: true,
    matchCount24h: 3,
    lastTriggered: "2025-02-10T11:15:00Z",
  },
  {
    id: "rule-005",
    name: "ssh-brute-force",
    description: "Detects multiple failed SSH login attempts",
    severity: "high",
    natsSubject: "samma.alerts.ssh.bruteforce",
    compliance: {
      pciDss: ["10.2.4"],
      nist80053: ["AC.7", "SI.4"],
      mitre: ["T1110"],
    },
    matchCondition:
      "source=sshd AND message contains 'Failed password' AND count > 5 in 60s",
    enabled: true,
    matchCount24h: 28,
    lastTriggered: "2025-02-10T13:42:00Z",
  },
  {
    id: "rule-006",
    name: "container-escape-attempt",
    description: "Detects potential container escape via host mount or privileged mode",
    severity: "critical",
    natsSubject: "samma.alerts.k8s.container_escape",
    compliance: {
      pciDss: ["6.5.6"],
      nist80053: ["SC.7", "AC.6"],
      mitre: ["T1611"],
    },
    matchCondition:
      "kind=Pod AND spec.containers[].securityContext.privileged=true",
    enabled: true,
    matchCount24h: 1,
    lastTriggered: "2025-02-10T08:30:00Z",
  },
  {
    id: "rule-007",
    name: "dns-exfiltration",
    description: "Detects unusually long DNS queries indicating potential data exfiltration",
    severity: "high",
    natsSubject: "samma.alerts.dns.exfiltration",
    compliance: {
      nist80053: ["SC.7", "SI.4"],
      mitre: ["T1048.003"],
    },
    matchCondition: "type=dns AND query_length > 100",
    enabled: false,
    matchCount24h: 0,
    lastTriggered: "2025-02-08T22:00:00Z",
  },
];
