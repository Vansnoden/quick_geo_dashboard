import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// In v5, we export the 'auth' function directly
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};