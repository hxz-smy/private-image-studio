import { NextRequest, NextResponse } from "next/server";
import { authCookieName, authEnabled, expectedSessionToken } from "@/lib/auth";

const publicPaths = ["/login", "/api/login", "/favicon.ico"];

function isPublicPath(pathname: string) {
  return (
    publicPaths.includes(pathname) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/assets/")
  );
}

export async function middleware(request: NextRequest) {
  if (!authEnabled() || isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(authCookieName())?.value;
  const expected = await expectedSessionToken();

  if (token && expected && token === expected) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", request.nextUrl.pathname);

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
