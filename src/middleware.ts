import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }
  
  // For all other paths, set locale header and continue without redirect
  const response = NextResponse.next();
  response.headers.set("x-next-intl-locale", routing.defaultLocale);
  
  return response;
}

export const config = {
  // Match all paths except API routes and static files
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
