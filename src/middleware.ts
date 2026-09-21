import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing(.*)',
  '/features(.*)',
  '/how-it-works(.*)',
  '/contact(.*)',
  '/auth/(.*)',
  '/sso-callback',
  '/api/public/(.*)'
]);

const isAuthRoute = createRouteMatcher([
  '/auth/sign-in(.*)',
  '/auth/sign-up(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  // If user is already signed in and tries to access sign-in or sign-up, redirect them
  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL('/company/register', req.url));
  }

  // Protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|otf|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*'
  ],
};
