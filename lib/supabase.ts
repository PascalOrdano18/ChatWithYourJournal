import { createBrowserClient, createServerClient } from "@supabase/ssr";

// Client-side Supabase client (for components)
export const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side Supabase client (for API routes) - Updated for better production support
export const createServerSupabaseClient = async () => {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options?: { [key: string]: unknown }) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch {
                        // The `set` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
                remove(name: string, options?: { [key: string]: unknown }) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch {
                        // The `delete` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
};

// Alternative server client that works better in production
export const createServerSupabaseClientFromRequest = async (request: Request) => {
    const { createServerClient } = await import("@supabase/ssr");
    
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    const cookieHeader = request.headers.get('cookie');
                    if (!cookieHeader) return undefined;
                    
                    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                        const [key, value] = cookie.trim().split('=');
                        acc[key] = value;
                        return acc;
                    }, {} as Record<string, string>);
                    
                    return cookies[name];
                },
                set() {
                    // No-op for server-side
                },
                remove() {
                    // No-op for server-side
                },
            },
        }
    );
};