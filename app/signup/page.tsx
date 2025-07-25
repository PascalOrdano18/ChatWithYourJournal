'use client'
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthForm from "../components/AuthForm";


export default function SingUp(){
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSignup = async (email: string, password: string) => {
        const {error} = await supabase.auth.signUp({email, password});

        if(error){
            setError(error.message);
            console.log("Error: ", error);
        } else {
            router.push('/');
        }
    }
    
    return(
        <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <AuthForm type="signup" onSubmit={handleSignup} errorMessage={error}/>
        </main>
    );
}