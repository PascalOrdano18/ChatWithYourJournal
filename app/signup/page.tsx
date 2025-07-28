'use client'
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AuthForm from "../components/AuthForm";
import { useUser } from "@/hooks/useUser";


export default function SignUp(){
    const [error, setError] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const router = useRouter();
    const {user, loading} = useUser();


    useEffect(() => {
        if(!loading && user){
            router.push('/journal');
        }
    }, [user, loading, router]);

    const handleSignup = async (email: string, password: string) => {
        setError('');
        const {error} = await supabase.auth.signUp({email, password});
        if(error){
            setError(error.message);
            console.log("Error: ", error);
        } else {
            setEmailSent(true);
        }
    }

    if(loading){
        return (
            <div>Loading...</div>
        );
    }
    if(user) return null;
    
    return(
        <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            {emailSent && (
                <div className="bg-green-100 text-green-800 p-4 rounded text-center text-sm">
                    ✅ A confirmation link has been sent to your email. Please verify your email before logging in.
                </div>
            )}
            <AuthForm type="signup" onSubmit={handleSignup} errorMessage={error}/>
        </main>
    );
}