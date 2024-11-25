import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only handle requests to /v1/*
  if (request.nextUrl.pathname.startsWith('/v1/')) {
    // Create new URL for proxy
    const url = new URL(request.url);
    url.protocol = 'http:';
    url.hostname = 'localhost';
    url.port = '8000';

    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: '/v1/:path*',
}; 