import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const RESERVED_SUBDOMAINS = new Set([
  "api",
  "app",
  "admin",
  "auth",
  "billing",
  "dashboard",
  "docs",
  "mail",
  "support",
  "www",
  "staging",
  "dev",
  "test",
  "demo",
  "clerk",
]);

const slugRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function parseSubdomain(hostname: string | null): string | null {
  if (!hostname) return null;
  const host = hostname.split(":")[0].toLowerCase().trim();

  // Production / Staging: *.easyhr.pro
  if (host.endsWith(".easyhr.pro")) {
    const parts = host.replace(".easyhr.pro", "").split(".");
    const sub = parts[parts.length - 1];
    return sub || null;
  }

  // Local development: *.localhost
  if (host.endsWith(".localhost") || host.includes(".localhost")) {
    const parts = host.replace(".localhost", "").split(".");
    const sub = parts[parts.length - 1];
    return sub || null;
  }

  return null;
}

const isPublicRoute = createRouteMatcher([
  '/',
  '/careers(.*)',
  '/pricing(.*)',
  '/features(.*)',
  '/how-it-works(.*)',
  '/contact(.*)',
  '/auth/(.*)',
  '/my-onboarding(.*)',
  '/sso-callback',
  '/workspace-not-found(.*)',
  '/api/public/(.*)',
  '/api/inbound(.*)'
]);

const isAuthRoute = createRouteMatcher([
  '/auth/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const host = req.headers.get("host") || "";
  const rawSubdomain = parseSubdomain(host);
  const pathname = req.nextUrl.pathname;
  const search = req.nextUrl.search;

  // Enforce HTTPS in production to enable Web Crypto and secure cookies
  const proto = req.headers.get("x-forwarded-proto");
  if (proto === "http" && !host.includes("localhost")) {
    return NextResponse.redirect(`https://${host}${pathname}${search}`, 308);
  }

  // 1. Handle "www": canonical redirect to apex
  if (rawSubdomain === "www") {
    const apexUrl = new URL(`${pathname}${search}`, "https://easyhr.pro");
    return NextResponse.redirect(apexUrl, 308);
  }

  // 2. Identify if this is a company workspace subdomain
  const isWorkspaceSubdomain = Boolean(rawSubdomain && !RESERVED_SUBDOMAINS.has(rawSubdomain));
  const workspaceSlug = isWorkspaceSubdomain ? rawSubdomain! : null;

  // Validate workspace slug pattern if present
  if (workspaceSlug && !slugRegex.test(workspaceSlug)) {
    const errorUrl = new URL(`/workspace-not-found?subdomain=${encodeURIComponent(workspaceSlug)}&reason=invalid_format`, req.url);
    return NextResponse.redirect(errorUrl);
  }

  const { userId } = await auth();

  // 3. Workspace Subdomain specific routing
  if (workspaceSlug) {
    // If accessing root '/' on a workspace subdomain (e.g. acme.easyhr.pro/)
    if (pathname === '/') {
      if (userId) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      } else {
        return NextResponse.redirect(new URL('/auth/sign-in', req.url));
      }
    }

    // If an authenticated user visits auth routes on a workspace subdomain, redirect to dashboard
    if (userId && isAuthRoute(req)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Protect private routes
    if (!isPublicRoute(req)) {
      await auth.protect();
    }

    // Inject workspace header and cookie so client components and APIs know the active tenant
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-workspace-subdomain", workspaceSlug);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    const isLocalhost = host.includes("localhost");
    response.cookies.set("easyhr_current_workspace", workspaceSlug, {
      path: "/",
      domain: isLocalhost ? undefined : ".easyhr.pro",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  }

  // 4. Apex / Central Domain Routing (easyhr.pro or localhost:3000)
  if (userId) {
    // If visiting root '/', redirect to their company workspace or dashboard
    if (pathname === '/') {
      const savedWorkspace = req.cookies.get("easyhr_current_workspace")?.value;
      if (savedWorkspace && slugRegex.test(savedWorkspace) && !RESERVED_SUBDOMAINS.has(savedWorkspace)) {
        const isLocalhost = host.includes("localhost");
        const port = host.includes(":") ? `:${host.split(":")[1]}` : "";
        const target = isLocalhost
          ? `http://${savedWorkspace}.localhost${port}/dashboard`
          : `https://${savedWorkspace}.easyhr.pro/dashboard`;
        return NextResponse.redirect(target);
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // If accessing sign-in / sign-up while authenticated
    if (isAuthRoute(req)) {
      if (pathname.startsWith('/auth/sign-up')) {
        return NextResponse.redirect(new URL('/company/register', req.url));
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Protect non-public routes on apex
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|otf|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*'
  ],
};
