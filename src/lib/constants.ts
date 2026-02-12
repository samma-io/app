export const SITE = {
  name: "Samma.io",
  tagline: "Security Scanner Manager",
  description:
    "Automated security scanning for Kubernetes with integrated SIEM",
  url: "https://samma.io",
} as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Scanners", href: "/scanners" },
  { label: "SIEM", href: "/siem" },
  { label: "About", href: "/about" },
] as const;

export const SCANNER_TYPES: Record<
  string,
  { label: string; color: string }
> = {
  nmap: { label: "Nmap", color: "bg-blue-100 text-blue-800" },
  nikto: { label: "Nikto", color: "bg-purple-100 text-purple-800" },
  tsunami: { label: "Tsunami", color: "bg-orange-100 text-orange-800" },
  dnsrecon: { label: "DNSRecon", color: "bg-green-100 text-green-800" },
} as const;
