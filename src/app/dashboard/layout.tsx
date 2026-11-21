import { headers } from "next/headers";
import Link from "next/link";
import { OrganizationList, OrganizationSwitcher } from "@clerk/nextjs";
import { LayoutDashboard, ShieldAlert, Target, Server, Key, Radar, Users, Settings } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getActiveOrg } from "@/lib/org";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/findings", label: "Findings", icon: ShieldAlert },
  { href: "/dashboard/profiles", label: "Profiles", icon: Target },
  { href: "/dashboard/scanners", label: "Scanners", icon: Radar },
  { href: "/dashboard/clusters", label: "Clusters", icon: Server },
  { href: "/dashboard/tokens", label: "API Tokens", icon: Key },
  { href: "/dashboard/settings/organization-members", label: "Members", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const activeOrg = await getActiveOrg();
  const pathname = (await headers()).get("x-pathname") ?? "";

  // Creating an org works without an active one.
  if (!activeOrg && pathname === "/dashboard/org/new") return <>{children}</>;

  // No org picked (or not a member any more): choose or create one in Clerk.
  if (!activeOrg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Choose an organization</h2>
          <p className="text-gray-500">Pick the organization to work in, or create a new one.</p>
          <div className="flex justify-center">
            <OrganizationList
              hidePersonal
              afterSelectOrganizationUrl="/dashboard"
              afterCreateOrganizationUrl="/dashboard"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-3 py-3 border-b border-gray-100">
          <p className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Organization
          </p>
          <div className="mt-1">
            <OrganizationSwitcher
              hidePersonal
              afterSelectOrganizationUrl="/dashboard"
              afterCreateOrganizationUrl="/dashboard"
              organizationProfileMode="navigation"
              organizationProfileUrl="/dashboard/settings"
              appearance={{ elements: { rootBox: "w-full", organizationSwitcherTrigger: "w-full justify-between" } }}
            />
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
