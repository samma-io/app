"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveOnboardingDetails } from "./actions";

function OnboardingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";

  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  if (!email) {
    router.replace("/sign-in");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !orgName.trim()) return;
    setIsPending(true);
    await saveOnboardingDetails(email, name.trim(), orgName.trim());
    await signIn("email", { email, redirect: false, callbackUrl: "/dashboard" });
    setSubmitted(true);
    setIsPending(false);
  }

  if (submitted) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
        <p className="text-sm font-medium text-green-800">Check your email</p>
        <p className="text-sm text-green-700 mt-1">
          A sign-in link has been sent to <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Full name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-samma-navy"
          disabled={isPending}
        />
      </div>
      <div>
        <label
          htmlFor="orgName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Organisation name
        </label>
        <input
          id="orgName"
          type="text"
          required
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="Acme Security"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-samma-navy"
          disabled={isPending}
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? "Sending…" : "Send magic link"}
      </Button>
    </form>
  );
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Shield className="h-10 w-10 text-samma-gold" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Samma</h1>
          <p className="text-sm text-gray-500">
            Tell us a bit about yourself to get started.
          </p>
        </div>
        <Suspense>
          <OnboardingForm />
        </Suspense>
      </div>
    </div>
  );
}
