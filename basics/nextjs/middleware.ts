import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Demo: protect /dashboard — check for a "session" cookie
  if (pathname.startsWith('/dashboard')) {
    const session = request.cookies.get('session');
    if (!session) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('message', 'Login required to access dashboard');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
