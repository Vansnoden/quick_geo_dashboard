'use server'

import { AuthError } from 'next-auth';
import { DASHBOARD_ADD_URL, DASHBOARD_CONFIG_URL, DASHBOARD_DELETE_URL, DASHBOARD_EDIT_URL, DASHBOARD_GET_URL, USER_DASH_DATA_ALL } from './constants';
import { cookies } from 'next/headers'
import { signIn, signOut, auth } from "@/auth";
import { Dashboard, DashboardResponse } from "./definitions";
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';


const DashboardSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  code: z.string().min(1, "Code is required"),
});


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
    // We add redirectTo here to be explicit
    await signIn('credentials', {
      ...Object.fromEntries(formData),
      redirectTo: '/admin/dashboards',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Handle actual login failures
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid username or password.';
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
  url.searchParams.append("query", query.toString());
  
  // if (query) url.searchParams.append("query", query);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${session.user.accessToken}`,
        "Content-Type": "application/json",
      },
      cache: 'no-store' // Use this if data changes frequently
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


export async function fetchDashboardById(id: number) {
  const session = await auth();

  if (!session?.user?.accessToken) return null;

  try {
    const response = await fetch(DASHBOARD_GET_URL(id), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.user.accessToken}`,
        'Content-Type': 'application/json',
      },
      // CRITICAL: Always get fresh data for the editor
      cache: 'no-store', 
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data as Dashboard;
  } catch (error) {
    console.error('Database Error:', error);
    return null;
  }
}


export async function deleteDashboard(id: number) {
  const session = await auth();
  
  try {
    const response = await fetch(DASHBOARD_DELETE_URL(id), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session?.user?.accessToken}`,
      },
    });

    if (!response.ok) throw new Error('Failed to delete dashboard');

    // Clear the cache for the dashboard list so the deleted item disappears
    revalidatePath('/admin/dashboards');
    return { message: 'Deleted Dashboard.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Dashboard.' };
  }
}


export async function createDashboard(formData: FormData) {
  const session = await auth();
  const validatedFields = DashboardSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) return { errors: validatedFields.error.flatten().fieldErrors };

  const response = await fetch(DASHBOARD_ADD_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.user?.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validatedFields.data),
  });

  if (!response.ok) throw new Error('Failed to create dashboard');

  revalidatePath('/admin/dashboards');
  redirect('/admin/dashboards');
}

export async function updateDashboard(id: number, formData: FormData) {
  const session = await auth();
  const validatedFields = DashboardSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) return { errors: validatedFields.error.flatten().fieldErrors };

  const response = await fetch(DASHBOARD_EDIT_URL(id), {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session?.user?.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validatedFields.data),
  });

  if (!response.ok) throw new Error('Failed to update dashboard');

  revalidatePath('/admin/dashboards');
  redirect('/admin/dashboards');
}


export async function updateDashboardYaml(id: number, yamlContent: string) {
  const session = await auth();
  
  await fetch(DASHBOARD_CONFIG_URL(id), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.user?.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ui_yaml_content: yamlContent }),
  });

  revalidatePath(`/admin/dashboards/${id}`);
}