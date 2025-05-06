import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const currentUserCookie = request.cookies.get('securenote-user')?.value;
  const { pathname } = request.nextUrl;

  // Allow access to API routes, Next.js specific paths, and public assets
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') ||
      pathname.endsWith('.ico') ||
      pathname.endsWith('.png') || // Add other static file extensions if needed
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.svg')) {
    return NextResponse.next();
  }
  
  const isAuthPage = pathname === '/login';

  if (!currentUserCookie && !isAuthPage) {
    // Redirect to login if not authenticated and not on login page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (currentUserCookie && isAuthPage) {
    // Redirect to notes if authenticated and on login page
    return NextResponse.redirect(new URL('/notes', request.url));
  }
  
  // If it's the root path and user is authenticated, redirect to /notes
  // If not authenticated, it will be caught by the rule above and redirected to /login
  if (pathname === '/' && currentUserCookie) {
    return NextResponse.redirect(new URL('/notes', request.url));
  }
  
  // If it's the root path and user is not authenticated, let it proceed (page.tsx will handle redirect to /login)
  if (pathname === '/' && !currentUserCookie) {
    return NextResponse.next();
  }


  return NextResponse.next();
}

export const config = {
  // Match all routes except for static assets and API routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
