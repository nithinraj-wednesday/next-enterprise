import { NextRequest, NextResponse } from "next/server"

const publicRoutes = ["/", "/sign-in", "/sign-up"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicRoutes.includes(pathname) || pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  try {
    const response = await fetch(new URL("/api/auth/get-session", request.nextUrl.origin), {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    })

    if (!response.ok) {
      return NextResponse.redirect(new URL("/sign-in", request.url))
    }

    const session = (await response.json()) as { session: unknown } | null

    if (!session?.session) {
      return NextResponse.redirect(new URL("/sign-in", request.url))
    }
  } catch {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
}
