'use client'

import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LogIn(){

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const router = useRouter();
    const user = useUser();

    if(user){
        router.push('/');
        return null;
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const {error} =  await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })

        if(error){
            console.log("Error: ", error);
        } else {
            router.push('/');
        }

    }


    return(
        <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-md space-y-6 max-w-md w-full text-black"
      >
        <h1 className="text-2xl font-semibold text-gray-800 text-center">Login</h1>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition hover:cursor-pointer"
        >
          Log In
        </button>

        <p className="text-sm text-center text-gray-600 mt-4">
            Dont have an account yet? 
            <br></br>
            <Link href="/signup" className="text-blue-600 underline">
                SING UP!
            </Link>
        </p>
      </form>
    </main>
    );
}