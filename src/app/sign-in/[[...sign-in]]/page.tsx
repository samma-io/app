"use client";

import { useEffect, useState } from "react";

export default function SignInPage() {
  const [SignIn, setSignIn] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("@clerk/nextjs").then((mod) => {
      setSignIn(() => mod.SignIn);
    }).catch(() => {
      // Clerk not configured
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-samma-lavender">
      {SignIn ? (
        <SignIn />
      ) : (
        <div className="text-center p-8 bg-white rounded-lg shadow-sm">
          <p className="text-gray-600">
            Authentication is not configured. Set your Clerk keys in{" "}
            <code className="bg-gray-100 px-1 rounded">.env.local</code> to
            enable sign in.
          </p>
        </div>
      )}
    </div>
  );
}
