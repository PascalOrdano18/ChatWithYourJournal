import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useUser(){

    const [user, setUser] = useState<null | { id:string, email?:string }>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({data, error}) => {
            if(!error && data.user){
                setUser(data.user);
            } else {
                setUser(null);
                console.log("Error: ", error);
            }
        })
    }, []);
    return user;
}