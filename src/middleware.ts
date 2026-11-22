import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/profile(.*)"]);

// Probes and the Prometheus scrape (GET only, no session): answered without
// Clerk, so they keep working whatever state Clerk or its keys are in.
const INFRA_PATHS = new Set(["/api/health", "/api/ready", "/api/metrics"]);

const withClerk = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  // Expose pathname to server components via header (read with headers()).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (INFRA_PATHS.has(request.nextUrl.pathname)) return NextResponse.next();
  return withClerk(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes (so auth() works); /api/v1 is not protected
    // here — it authenticates with API tokens.
    "/(api|trpc)(.*)",
  ],
};
