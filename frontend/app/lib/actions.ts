'use server'

import { AuthError } from 'next-auth';
import { DASHBOARD_ADD_URL, DASHBOARD_CONFIG_URL, DASHBOARD_DELETE_URL, DASHBOARD_EDIT_URL, DASHBOARD_GET_URL, SIGNUP_URL, USER_DASH_DATA_ALL } from './constants';
import { cookies } from 'next/headers'
import { signIn, signOut, auth } from "@/auth";
import { Dashboard, DashboardResponse, DashboardConfig } from "./definitions";
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
  await signOut({ redirectTo: '/' });
}


// Add to lib/actions.ts

export async function signup(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const fullname = formData.get('fullname');
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');

    // Basic validation
    if (!fullname || !username || !email || !password) {
      return 'All fields are required.';
    }

    if (password.toString().length < 4) {
      return 'Password must be at least 4 characters.';
    }

    // Prepare user data
    const userData = {
      fullname: fullname.toString(),
      username: username.toString(),
      email: email.toString(),
      password: password.toString(),
    };

    // Call your Python backend
    const response = await fetch(SIGNUP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle specific error cases
      if (response.status === 400) {
        if (errorData.detail === "Username already registered") {
          return 'Username already exists. Please choose another.';
        }
        return errorData.detail || 'Registration failed. Please check your information.';
      }
      
      return 'Something went wrong. Please try again.';
    }

    //  Log in after successful registration
    try {
      await signIn('credentials', {
        username: username.toString(),
        password: password.toString(),
        redirect: false, // Important: set redirect to false
      });
      
      // Manually redirect after successful sign in
      redirect('/admin/dashboards');
      
    } catch (loginError) {
      console.error('Auto-login failed:', loginError);
      // If auto-login fails, redirect to login page
      redirect('/login?registered=true');
    }

    return undefined; // No error, success
  } catch (error) {
    if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw redirects so Next.js can handle them
    }
    
    console.error('Signup error:', error);
    return 'An unexpected error occurred. Please try again.';
  }
}



export async function getUserDashboardData(query: string, currentPage: number) {
  const session = await auth();
  
  if (!session?.user?.accessToken) { // eslint-disable-line
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
        "Authorization": `Bearer ${session.user.accessToken}`, // eslint-disable-line
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

  if (!session?.user?.accessToken) return null; // eslint-disable-line

  try {
    const response = await fetch(DASHBOARD_GET_URL(id), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.user.accessToken}`, // eslint-disable-line
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
        'Authorization': `Bearer ${session?.user?.accessToken}`, // eslint-disable-line
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
  console.log("WE ARE IN ...");
  const session = await auth();
  const validatedFields = DashboardSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) return { errors: validatedFields.error.flatten().fieldErrors };

  const response = await fetch(DASHBOARD_ADD_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.user?.accessToken}`, // eslint-disable-line
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
      'Authorization': `Bearer ${session?.user?.accessToken}`, // eslint-disable-line
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
  
  if (!session?.user?.accessToken) { // eslint-disable-line
    throw new Error("Unauthorized");
  }

  try {
    const response = await fetch(DASHBOARD_CONFIG_URL(id), {
      method: 'PUT', // Your Python decorator is @app.put
      headers: {
        'Authorization': `Bearer ${session.user.accessToken}`, // eslint-disable-line
        'Content-Type': 'application/json',
      },
      // Ensure the key matches your Python "DashboardConfigUpdate" schema
      body: JSON.stringify({ yaml_content: yamlContent }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update configuration');
    }

    // Refresh the page data so the UI reflects the saved state
    revalidatePath(`/admin/dashboards/${id}`);
    
    return { success: true };
  } catch (error) {
    console.error('YAML Update Error:', error);
    return { success: false, message: 'Failed to save configuration.' };
  }
}


export async function getDashboardConfig(id: string): Promise<DashboardConfig> {
  const res = await fetch(DASHBOARD_CONFIG_URL(Number(id)));
  if (!res.ok) throw new Error('Dashboard not found');
  return res.json();
}