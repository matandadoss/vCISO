import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Generate a secure nonce for inline scripts
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  
  // Define strict Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'unsafe-eval' 'unsafe-inline' https://apis.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://firebasestorage.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://* wss://* ws://localhost:* http://localhost:*;
    frame-src 'self' https://vciso.firebaseapp.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  // Apply comprehensive security headers
  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  return response
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
}
