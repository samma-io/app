"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkUserExists } from "./actions";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setIsPending(true);

    const exists = await checkUserExists(email);
    if (!exists) {
      router.push(`/onboarding?email=${encodeURIComponent(email)}`);
      return;
    }

    await signIn("email", { email, redirect: false, callbackUrl: "/dashboard" });
    setSubmitted(true);
    setIsPending(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Shield className="h-10 w-10 text-samma-gold" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to Samma</h1>
          <p className="text-sm text-gray-500">
            We&apos;ll send a magic link to your email.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-sm font-medium text-green-800">Check your email</p>
            <p className="text-sm text-green-700 mt-1">
              A sign-in link has been sent to <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
              {isPending ? "Checking…" : "Continue"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
