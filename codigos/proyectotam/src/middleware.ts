import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('tam_session')
  const role = request.cookies.get('tam_user_role')?.value

  const { pathname } = request.nextUrl

  // Avoid redirect loop for login or asset routes
  if (pathname.startsWith('/login')) {
    if (session) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Check if session exists
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based route authorization (UX Protection)
  if (pathname.startsWith('/auditoria') && role !== 'project_manager') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (pathname.startsWith('/deposito') && role !== 'project_manager' && role !== 'deposit_manager') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - PDF files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.pdf).*)',
  ],
}
