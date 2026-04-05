"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  User,
  Mail,
  Calendar,
  Radar,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-samma-navy border-t-transparent rounded-full" />
      </div>
    );
  }

  const email = session?.user?.email;
  const name = session?.user?.name;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-samma-navy text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-gray-300">Manage your account and preferences.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">
              Account Information
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-6">
              <div className="h-20 w-20 rounded-full bg-samma-lavender flex items-center justify-center">
                <User className="h-10 w-10 text-samma-navy" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {name || "Samma User"}
                </h3>
                <p className="text-gray-500">Samma.io Member</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="h-5 w-5 text-gray-400" />
                <span>{email || "No email on file"}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span>Samma.io Member</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/profile/scanners" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-samma-lavender p-3">
                    <Radar className="h-6 w-6 text-samma-navy" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      Scanners Dashboard
                    </h3>
                    <p className="text-sm text-gray-500">
                      Monitor scanners, targets, and findings
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile/siem" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-samma-lavender p-3">
                    <ShieldCheck className="h-6 w-6 text-samma-navy" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      SIEM Dashboard
                    </h3>
                    <p className="text-sm text-gray-500">
                      Rules, alerts, log sources, and compliance
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
