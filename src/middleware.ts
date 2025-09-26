import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase-server';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/settings',
  '/exports',
  '/subscription',
  '/history',
  '/api/v1/profile',
  '/api/v1/time-entries',
  '/api/v1/subscription',
  '/api/v1/exports',
];

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/api/webhooks',
  '/api/auth',
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient(req, res);

  // Get the pathname of the request
  const { pathname } = req.nextUrl;

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // TEMPORARY: Mock user for testing
  const user = {
    id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
    email: 'demo@timetracker.com'
  };
  const error = null;

  // Commented out real auth for testing
  // const {
  //   data: { user },
  //   error,
  // } = await supabase.auth.getUser();

  // Handle authentication errors
  if (error) {
    console.error('Auth middleware error:', error.message);
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return res;
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Redirect unauthenticated users from protected routes
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // TEMPORARY: Skip subscription check for testing
  // Check subscription status for API routes (except auth routes)
  if (false && user && pathname.startsWith('/api/v1') && !pathname.startsWith('/api/v1/auth')) {
    try {
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Subscription check error:', subError.message);
        return NextResponse.json(
          { error: 'Subscription check failed' },
          { status: 500 }
        );
      }

      // If no subscription or inactive subscription, return 402 Payment Required
      if (!subscription || (subscription.status !== 'active' && subscription.status !== 'trialing')) {
        return NextResponse.json(
          {
            error: 'Active subscription or trial required',
            code: 'SUBSCRIPTION_REQUIRED',
            subscription_status: subscription?.status || 'none'
          },
          { status: 402 }
        );
      }
    } catch (err) {
      console.error('Middleware subscription check error:', err);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  // Add user info to request headers for API routes
  if (user && pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email || '');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};