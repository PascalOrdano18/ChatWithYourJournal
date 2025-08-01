"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import Navbar from "@/app/components/Navbar";
import ChatWithJournal from "@/components/chat/ChatWithJournal";
import { useEffect } from "react";

export default function JournalChatPage() {
  const { user, loading } = useUser();
  const { theme, toggleTheme } = useTheme();
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
        onToggleTheme={toggleTheme}
        theme={theme}
      />
      <div className="p-6">
        <ChatWithJournal />
      </div>
    </main>
  );
}