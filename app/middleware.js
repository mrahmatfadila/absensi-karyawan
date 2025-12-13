import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // List of protected paths
  const protectedPaths = ['/', '/admin', '/manager', '/attendance'];
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path) && pathname !== '/login' && pathname !== '/register'
  );

  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  
  if (!token && isProtectedPath) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If trying to access login/register while already logged in
  if (token && (pathname === '/login' || pathname === '/register')) {
    // Get user role from request (you might need to decode JWT here)
    // For now, redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};