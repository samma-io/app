import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { CreateOrgForm } from "@/components/dashboard/create-org-form";

export default async function NewOrgPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/sign-in");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Shield className="h-10 w-10 text-samma-gold" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create your organization
          </h1>
          <p className="text-sm text-gray-500">
            Give your organization a name to get started.
          </p>
        </div>
        <CreateOrgForm />
      </div>
    </div>
  );
}
