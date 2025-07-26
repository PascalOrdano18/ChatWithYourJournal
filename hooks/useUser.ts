import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useUser(){

    const [user, setUser] = useState<null | { id:string, email?:string }>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getUser().then(({data}) => {
            setUser(data?.user ?? null);
            setLoading(false);
        });

        const {data:listener} = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            listener.subscription.unsubscribe();
        }
    }, []);

    return { user, loading };
}