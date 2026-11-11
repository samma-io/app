import { SignIn } from "@clerk/nextjs";
import { Shield } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md flex flex-col items-center space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Shield className="h-10 w-10 text-samma-gold" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to Samma</h1>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
