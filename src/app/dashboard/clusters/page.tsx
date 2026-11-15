import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RemoveClusterButton } from "@/components/dashboard/remove-cluster-button";
import { clusterStatus, READY_WINDOW_MS } from "@/lib/clusters";
import { getActiveOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

// Status depends on the time of the request.
export const dynamic = "force-dynamic";

export default async function ClustersPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/dashboard");

  const clusters = await prisma.cluster.findMany({
    where: { organisationId: org.id },
    include: { _count: { select: { targets: true } } },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const ready = clusters.filter((c) => clusterStatus(c.lastSeenAt, now) === "READY").length;
  const windowMinutes = READY_WINDOW_MS / 60_000;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clusters</h1>
        <p className="text-gray-500 mt-1">
          Kubernetes clusters running the samma operator or collector with one of your API tokens.
        </p>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">
            {clusters.length === 0
              ? "No clusters connected yet"
              : `${ready} of ${clusters.length} ready`}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {clusters.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              Set <code className="text-xs bg-gray-100 px-1 rounded">clusterName</code> in the
              samma-operator Helm chart and turn on the collector. The cluster shows up here after
              its first poll.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Last seen</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Version</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Targets</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Connected</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clusters.map((cluster) => {
                  const status = clusterStatus(cluster.lastSeenAt, now);
                  return (
                    <tr key={cluster.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-gray-900">{cluster.name}</td>
                      <td className="px-6 py-3">
                        <Badge
                          className={
                            status === "READY"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {status === "READY" ? "Ready" : "Down"}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-gray-400">
                        {formatDate(cluster.lastSeenAt.toISOString())}
                      </td>
                      <td className="px-6 py-3 text-gray-500 font-mono">
                        {cluster.version ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-500">{cluster._count.targets}</td>
                      <td className="px-6 py-3 text-gray-400">
                        {formatDate(cluster.createdAt.toISOString())}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <RemoveClusterButton clusterId={cluster.id} clusterName={cluster.name} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-gray-500">
        A cluster is <strong>Ready</strong> while it has called the API in the last {windowMinutes}{" "}
        minutes; the collector polls every 5 minutes by default. Calls name the cluster with the{" "}
        <code className="text-xs bg-gray-100 px-1 rounded">X-Samma-Cluster</code> header, which the
        operator and collector send when the chart&apos;s{" "}
        <code className="text-xs bg-gray-100 px-1 rounded">clusterName</code> is set. Targets the
        operator adds are linked to the cluster that added them.
      </p>
    </div>
  );
}
