import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Add 'base_api' to the exclusion list if that is where your auth routes live
  matcher: ['/((?!api|base_api|_next/static|_next/image|.*\\.png$).*)'],
};