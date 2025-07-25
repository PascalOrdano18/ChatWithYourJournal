'use client'

import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthForm from "../components/AuthForm";

export default function LogIn(){
    const [error, setError] = useState('');

    const router = useRouter();

    const handleLogin = async (email: string, password: string) => {
        const {error} =  await supabase.auth.signInWithPassword({email, password});

        if(error){
            setError(error.message);
            console.log("Error: ", error);
        } else {
            router.push('/');
        }

    }
    return(
        <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <AuthForm type="login" onSubmit={handleLogin} errorMessage={error}/>
        </main>
    );
}