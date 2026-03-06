import NextAuth from "next-auth";
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { AUTH_URL, USERINFO_URL } from './app/lib/constants';
import { cookies } from 'next/headers';
import { authConfig } from './auth.config'; // Import your edge config

async function getUser(token: string) {
    const response = await fetch(USERINFO_URL, {
        method: 'GET',
        headers: { "Authorization": token }
    });
    return response.json();
}

export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig, // Spread the base config (matcher, etc.)
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsed = z
                    .object({ username: z.string(), password: z.string().min(4) })
                    .safeParse(credentials);

                if (!parsed.success) return null;

                const formData = new FormData();
                formData.append("username", parsed.data.username);
                formData.append("password", parsed.data.password);

                const response = await fetch(AUTH_URL, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) return null;

                // 1. Consume the JSON only ONCE
                const data = await response.json();

                if (data.access_token) {
                    const fullToken = `${data.token_type} ${data.access_token}`;
                    
                    // 2. Set the external cookie
                    const cookieStore = await cookies();
                    cookieStore.set("auth-token", fullToken.replace(" ", "__"), {
                        maxAge: 60 * 60 * 24 * 7,
                        path: "/"
                    });

                    // 3. Get user data
                    const userData = await getUser(fullToken);
                    
                    // 4. Return user object + token for the JWT callback
                    return { ...userData, accessToken: data.access_token };
                }
                
                return null;
            },
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            // Persist the user data to the token right after sign in
            if (user) {
                token.user = user;
            }
            return token;
        },
        async session({ session, token }) {
            // Pass the user data from the token to the session
            session.user = token.user as any;
            return session;
        },
    },
});