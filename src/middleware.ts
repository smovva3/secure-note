
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const currentUserCookie = request.cookies.get('securenote-user-session')?.value;
  const { pathname } = request.nextUrl;

  // Allow access to API routes, Next.js specific paths, and public assets
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') || // Assuming '/static/' is for other static assets not in /public
      pathname.startsWith('/uploads/') || // Allow access to uploaded files
      pathname.endsWith('.ico') ||
      pathname.endsWith('.png') || 
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.gif') ||
      pathname.endsWith('.webp') ||
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
  // Match all routes except for those explicitly excluded patterns
  // Added /uploads/ to exclusions.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

