'use client'

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AuthForm from "../components/AuthForm";
import { useUser } from "@/hooks/useUser";

export default function LogIn() {
  const [error, setError] = useState('');
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/journal');
    }
  }, [user, loading, router]);

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      console.log("Error: ", error);
    }
  };

  if (loading || user) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <AuthForm type="login" onSubmit={handleLogin} errorMessage={error} />
    </main>
  );
}
