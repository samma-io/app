import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddTargetForm } from "@/components/dashboard/add-target-form";
import { DeleteTargetButton } from "@/components/dashboard/delete-target-button";
import { getActiveOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProfileDetailPage({ params }: Props) {
  const org = await getActiveOrg();
  if (!org) redirect("/dashboard");

  const { id } = await params;

  const profile = await prisma.profile.findFirst({
    where: { id, organisationId: org.id },
    include: {
      targets: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!profile) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/profiles"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Profiles
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
            <p className="text-gray-500 mt-1">
              {profile.targets.length}{" "}
              {profile.targets.length === 1 ? "target" : "targets"}
            </p>
          </div>
          <AddTargetForm profileId={profile.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Targets</h2>
        </CardHeader>
        <CardContent className="p-0">
          {profile.targets.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              No targets yet. Click &ldquo;Add Target&rdquo; to add your first IP or DNS
              entry.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">
                    Port
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">
                    Label
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">
                    Added
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">
                    Scanner
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {profile.targets.map((target) => (
                  <tr key={target.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-3">
                      <Link
                        href={`/dashboard/profiles/${profile.id}/targets/${target.id}`}
                        className="font-mono text-gray-900 hover:text-samma-navy hover:underline"
                      >
                        {target.value}
                      </Link>
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
                    <td className="px-6 py-3 text-gray-500 font-mono">
                      {target.port ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {target.label ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-gray-400">
                      {formatDate(target.createdAt.toISOString())}
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        className={
                          target.scannerStatus === "DEPLOYED"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {target.scannerStatus === "DEPLOYED" ? "Deployed" : "Ready to deploy"}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        className={
                          target.reachabilityStatus === "UP"
                            ? "bg-green-100 text-green-800"
                            : target.reachabilityStatus === "DOWN"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {target.reachabilityStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <DeleteTargetButton
                        targetId={target.id}
                        profileId={profile.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* API usage hint */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">
            Add targets via API
          </h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-3">
            Use your org&apos;s API token to programmatically add targets to this
            profile.
          </p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-auto">
            {`curl -X POST https://your-domain/api/v1/targets \\
  -H "Authorization: Bearer <your-api-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "value": "192.168.1.1",
    "type": "ip",
    "label": "Main server",
    "profileId": "${profile.id}"
  }'`}
          </pre>
          <p className="text-xs text-gray-400 mt-2">
            Manage API tokens in{" "}
            <Link
              href="/dashboard/tokens"
              className="text-samma-navy hover:underline"
            >
              Dashboard → API Tokens
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
