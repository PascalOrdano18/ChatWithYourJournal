"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";
import Navbar from "@/app/components/Navbar";
import ChatWithJournal from "@/components/chat/ChatWithJournal";
import { useEffect } from "react";


export default function JournalChatPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if(!loading && user === null){
      router.push('/login');
    }
  }, [user, loading, router]);
  
  if(loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  const handleSignOut = async() => {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar 
        title="Chat with Journal"
        subtitle="🔍 Chat with your Journal"
        onSignOut={handleSignOut}
      />
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <ChatWithJournal />
      </div>
    </main>
  );
}