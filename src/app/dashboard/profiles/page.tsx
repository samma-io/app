import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateProfileForm } from "@/components/dashboard/create-profile-form";
import { DeleteProfileButton } from "@/components/dashboard/delete-profile-button";
import { getActiveOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function ProfilesPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/dashboard");

  const profiles = await prisma.profile.findMany({
    where: { organisationId: org.id },
    include: { _count: { select: { targets: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profiles</h1>
          <p className="text-gray-500 mt-1">
            Group scan targets into named profiles.
          </p>
        </div>
        <CreateProfileForm />
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">
            {profiles.length === 0
              ? "No profiles yet"
              : `${profiles.length} profile${profiles.length === 1 ? "" : "s"}`}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {profiles.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              Create your first profile to start adding scan targets.
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {profiles.map((profile) => (
                <li key={profile.id} className="flex items-center group">
                  <Link
                    href={`/dashboard/profiles/${profile.id}`}
                    className="flex-1 flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {profile.name}
                        </p>
                        <Badge
                          className={
                            profile.type === "FULL"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {profile.type === "FULL" ? "Deep scan" : "Quick scan"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Created {formatDate(profile.createdAt.toISOString())}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {profile._count.targets}{" "}
                        {profile._count.targets === 1 ? "target" : "targets"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </Link>
                  <div className="px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DeleteProfileButton
                      profileId={profile.id}
                      profileName={profile.name}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
