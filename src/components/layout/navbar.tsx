"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

let ClerkComponents: {
  SignedIn: React.ComponentType<{ children: React.ReactNode }>;
  SignedOut: React.ComponentType<{ children: React.ReactNode }>;
  UserButton: React.ComponentType<{ afterSignOutUrl?: string }>;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerk = require("@clerk/nextjs");
  ClerkComponents = {
    SignedIn: clerk.SignedIn,
    SignedOut: clerk.SignedOut,
    UserButton: clerk.UserButton,
  };
} catch {
  // Clerk not available
}

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasClerk =
  ClerkComponents &&
  clerkKey &&
  clerkKey.startsWith("pk_") &&
  !clerkKey.includes("REPLACE");

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-samma-navy shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-samma-gold" />
            <span className="text-xl font-bold text-white">Samma.io</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-samma-navy-dark text-samma-gold"
                    : "text-gray-200 hover:text-white hover:bg-samma-navy-dark"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {hasClerk && ClerkComponents ? (
              <>
                <ClerkComponents.SignedOut>
                  <Link href="/sign-in">
                    <Button
                      variant="ghost"
                      className="text-gray-200 hover:text-white"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button variant="primary" size="sm">
                      Get Started
                    </Button>
                  </Link>
                </ClerkComponents.SignedOut>
                <ClerkComponents.SignedIn>
                  <Link
                    href="/profile"
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      pathname === "/profile"
                        ? "bg-samma-navy-dark text-samma-gold"
                        : "text-gray-200 hover:text-white hover:bg-samma-navy-dark"
                    )}
                  >
                    Profile
                  </Link>
                  <ClerkComponents.UserButton afterSignOutUrl="/" />
                </ClerkComponents.SignedIn>
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button
                    variant="ghost"
                    className="text-gray-200 hover:text-white"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-samma-navy-dark border-t border-samma-navy-light">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-samma-navy text-samma-gold"
                    : "text-gray-200 hover:text-white hover:bg-samma-navy"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-samma-navy-light">
              <Link
                href="/sign-in"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2 text-sm text-gray-200 hover:text-white"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
