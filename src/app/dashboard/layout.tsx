import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { LayoutDashboard, Target, Key } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getActiveOrg, getUserOrgs } from "@/lib/org";
import { OrgPickerClient } from "@/components/dashboard/org-picker-client";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/profiles", label: "Profiles", icon: Target },
  { href: "/dashboard/tokens", label: "API Tokens", icon: Key },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/sign-in");

  const orgs = await getUserOrgs(session.user.id);
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (orgs.length === 0 && pathname !== "/dashboard/org/new") {
    redirect("/dashboard/org/new");
  }

  // Render the org-creation page without the sidebar shell
  if (orgs.length === 0) return <>{children}</>;

  const activeOrg = await getActiveOrg();

  if (!activeOrg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 max-w-md px-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Select an Organization
          </h2>
          <p className="text-gray-500">
            Choose which organization to work in.
          </p>
          <OrgPickerClient orgs={orgs} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Organization
          </p>
          <p className="text-sm font-medium text-gray-900 truncate mt-0.5">
            {activeOrg.name}
          </p>
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
