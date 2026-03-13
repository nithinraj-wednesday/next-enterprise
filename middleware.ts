import { getSessionCookie } from "better-auth/cookies"
import { NextRequest, NextResponse } from "next/server"

const publicRoutes = ["/"]
const authRoutes = ["/sign-in", "/sign-up"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  const sessionCookie = getSessionCookie(request)

  if (authRoutes.includes(pathname) && sessionCookie) {
    return NextResponse.redirect(new URL("/music", request.url))
  }

  if (publicRoutes.includes(pathname) || authRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images|favicon.ico|api/auth).*)"],
}
