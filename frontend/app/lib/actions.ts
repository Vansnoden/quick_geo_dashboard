'use server'

import AuthError from "next-auth";
import { USER_DASH_DATA_ALL } from './constants';
import { cookies } from 'next/headers'
import { signIn, signOut, auth } from "@/auth";
import { Dashboard, DashboardResponse } from "./definitions";


export type State = {
    errors?: {
      status?: string[];
    };
    message?: string | null;
};

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function getToken(){
  const cookieStore = await cookies()
  const base_token = cookieStore.get('auth-token')
  const token = base_token?.value.split("__").join(" ")
  // return (session?.user as any).accessToken; // eslint-disable-line
  return token
}


export async function handleSignOut() {
  // 1. Clear your custom cookie first
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
  
  // 2. Trigger the NextAuth signout
  // This will throw a redirect error which Next.js handles automatically
  await signOut({ redirectTo: '/login' });
}



export async function getUserDashboardData(query: string, currentPage: number) {
  const session = await auth();
  
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized: No access token found");
  }

  const limit = 10;
  const skip = (currentPage - 1) * limit;

  const url = new URL(USER_DASH_DATA_ALL);
  url.searchParams.append("skip", skip.toString());
  url.searchParams.append("limit", limit.toString());
  
  // if (query) url.searchParams.append("query", query);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${session.user.accessToken}`,
        "Content-Type": "application/json",
      },
      // cache: 'no-store' // Use this if data changes frequently
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboards: ${response.statusText}`);
    }

    const data = await response.json();
    return data as DashboardResponse;
  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    return []; // Return empty array to prevent UI crash
  }
}