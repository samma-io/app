import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { CreateSiemForm } from "@/components/dashboard/create-siem-form";
import { getActiveOrg } from "@/lib/org";
import { SIEM_PROVIDERS } from "@/lib/siem";

export default async function NewSiemPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/siem" className="text-sm text-gray-500 hover:text-samma-navy">
          ← SIEM
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">New SIEM</h1>
        <p className="mt-1 text-gray-500">
          Deploy a SIEM with{" "}
          <a href="https://ankra.io" target="_blank" rel="noreferrer" className="text-samma-navy hover:underline">
            Ankra
          </a>
          , or connect one you already run.
        </p>
      </div>
      <Card>
        <CardContent className="py-6">
          <CreateSiemForm
            providers={SIEM_PROVIDERS.map((p) => ({ id: p.id, label: p.label, regions: p.regions }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
