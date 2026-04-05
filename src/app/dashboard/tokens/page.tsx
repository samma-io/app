import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CreateTokenForm } from "@/components/dashboard/create-token-form";
import { RevokeTokenButton } from "@/components/dashboard/revoke-token-button";
import { getActiveOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function TokensPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/dashboard");

  const tokens = await prisma.apiToken.findMany({
    where: { organisationId: org.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Tokens</h1>
          <p className="text-gray-500 mt-1">
            Use tokens to add targets programmatically via the REST API.
          </p>
        </div>
        <CreateTokenForm />
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">
            {tokens.length === 0
              ? "No tokens yet"
              : `${tokens.length} token${tokens.length === 1 ? "" : "s"}`}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {tokens.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              Generate a token to start using the API.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">
                    Last Used
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">
                    Token
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {token.name}
                    </td>
                    <td className="px-6 py-3 text-gray-400">
                      {formatDate(token.createdAt.toISOString())}
                    </td>
                    <td className="px-6 py-3 text-gray-400">
                      {token.lastUsedAt
                        ? formatDate(token.lastUsedAt.toISOString())
                        : "Never"}
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        ••••••••••••••••
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <RevokeTokenButton
                        tokenId={token.id}
                        tokenName={token.name}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* API reference */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">
            API Reference
          </h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">
            Add targets programmatically using the{" "}
            <code className="text-xs bg-gray-100 px-1 rounded">
              POST /api/v1/targets
            </code>{" "}
            endpoint.
          </p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-auto">
            {`curl -X POST https://your-domain/api/v1/targets \\
  -H "Authorization: Bearer <your-api-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "value": "192.168.1.1",
    "type": "ip",
    "label": "Main server",
    "profileId": "<profile-id>"
  }'`}
          </pre>
          <div className="text-sm text-gray-500 space-y-1">
            <p>
              <strong>type</strong> — must be{" "}
              <code className="text-xs bg-gray-100 px-1 rounded">ip</code> or{" "}
              <code className="text-xs bg-gray-100 px-1 rounded">dns</code>
            </p>
            <p>
              <strong>profileId</strong> — find this on the profile&apos;s
              detail page
            </p>
            <p>
              <strong>label</strong> — optional human-readable description
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
