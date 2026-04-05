"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

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
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname.startsWith("/dashboard")
                      ? "bg-samma-navy-dark text-samma-gold"
                      : "text-gray-200 hover:text-white hover:bg-samma-navy-dark"
                  )}
                >
                  Dashboard
                </Link>
                <Button
                  variant="ghost"
                  className="text-gray-200 hover:text-white"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  className="text-gray-200 hover:text-white"
                >
                  Sign In
                </Button>
              </Link>
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
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-200 hover:text-white"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="block px-4 py-2 text-sm text-gray-200 hover:text-white"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-200 hover:text-white"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
