import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// PERFORMANCE OPTIMIZED: Minimal middleware for development
// Since auth is mocked, we remove expensive Supabase client creation

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // FAST: Early return for known static/dev routes
  if (pathname.startsWith('/.well-known/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/auth/') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // TEMPORARY: Mock user for testing (ultra-fast)
  const user = {
    id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
    email: 'demo@timetracker.com'
  };

  // Fast route checks (no expensive operations)
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isDashboard = pathname.startsWith('/dashboard');

  // Minimal redirects
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (!user && isDashboard) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Add minimal user headers for API routes only
  if (pathname.startsWith('/api/v1/')) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // PERFORMANCE: Only run on specific routes that need auth
    '/dashboard/:path*',
    '/settings/:path*',
    '/login',
    '/signup',
    '/api/v1/:path*',
  ],
};