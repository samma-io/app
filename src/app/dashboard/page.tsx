import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers, Target, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getActiveOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/dashboard");

  const [profiles, recentTargets] = await Promise.all([
    prisma.profile.findMany({
      where: { organisationId: org.id },
      include: { _count: { select: { targets: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.target.findMany({
      where: { profile: { organisationId: org.id } },
      include: { profile: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const totalTargets = profiles.reduce((sum, p) => sum + p._count.targets, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-1">
          Summary of your organization&apos;s scan targets.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Profiles</p>
              <p className="text-2xl font-bold text-gray-900">
                {profiles.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="p-2.5 bg-green-50 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Targets</p>
              <p className="text-2xl font-bold text-gray-900">{totalTargets}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="p-2.5 bg-purple-50 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Recently Added</p>
              <p className="text-2xl font-bold text-gray-900">
                {recentTargets.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent targets */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">
            Recent Targets
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          {recentTargets.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              No targets yet.{" "}
              <Link
                href="/dashboard/profiles"
                className="text-samma-navy hover:underline"
              >
                Create a profile
              </Link>{" "}
              to get started.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">
                    Profile
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentTargets.map((target) => (
                  <tr key={target.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-gray-900">
                      {target.value}
                      {target.label && (
                        <span className="ml-2 text-xs text-gray-400 font-sans">
                          {target.label}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        className={
                          target.type === "ip"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }
                      >
                        {target.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {target.profile.name}
                    </td>
                    <td className="px-6 py-3 text-gray-400">
                      {formatDate(target.createdAt.toISOString())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
