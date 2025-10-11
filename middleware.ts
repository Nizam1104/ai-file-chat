import { NextRequest, NextResponse } from "next/server"
import NextAuth from "next-auth"
import authConfig from "./auth.config"

const { auth } = NextAuth(authConfig)

export default auth(async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Define your route arrays
  const unProtectedRoutes = [
    "/",
    "/about",
    "/contact",
    "/public",
    "/snippet"
    // Add more public routes here
  ]

  const authRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    // Add more auth-related routes here
  ]

  // Helper function to check if current path matches any route pattern
  const isRouteMatch = (routes: string[], currentPath: string): boolean => {
    return routes.some(route => {
      // Exact match
      if (route === currentPath) return true
      // Wildcard match for nested routes (e.g., "/public" matches "/public/docs")
      if (route.endsWith('/*')) {
        const baseRoute = route.slice(0, -2)
        return currentPath.startsWith(baseRoute)
      }
      // Check if current path starts with the route (for nested routes)
      return currentPath.startsWith(route + '/') || currentPath === route
    })
  }

  const isUnProtectedRoute = isRouteMatch(unProtectedRoutes, pathname)
  const isAuthRoute = isRouteMatch(authRoutes, pathname)

  // Any route not in unProtectedRoutes or authRoutes is considered protected
  const isProtectedRoute = !isUnProtectedRoute && !isAuthRoute

  // Get the session from the auth function
  const session = await auth()

  // If user is not authenticated
  if (!session?.user) {
    // Redirect to login if trying to access protected route
    if (isProtectedRoute) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    // Allow access to unprotected and auth routes
    if (isUnProtectedRoute || isAuthRoute) {
      return NextResponse.next()
    }
  }

  // If user is authenticated
  if (session?.user) {
    // Redirect authenticated users away from auth routes
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/chat', req.url))
    }

    // Allow access to protected and unprotected routes
    if (isProtectedRoute || isUnProtectedRoute) {
      return NextResponse.next()
    }
  }

  // Default: allow the request to continue
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
