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
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set({ name, value, ...options });
                        });
                    } catch {
                        // Called from a Server Component. Can be ignored if middleware refreshes sessions.
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
                getAll() {
                    const cookieHeader = request.headers.get('cookie');
                    if (!cookieHeader) return [] as Array<{ name: string; value: string }>;
                    return cookieHeader.split(';').map((c) => {
                        const [rawName, ...rest] = c.trim().split('=');
                        return { name: rawName, value: rest.join('=') };
                    });
                },
                setAll() {
                    // No-op on API route Request context (cannot set response cookies here)
                },
            },
        }
    );
};