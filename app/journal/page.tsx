"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { format } from "date-fns";

import { supabase }  from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { Calendar } from "@/components/ui/calendar";
import Navbar from "@/app/components/Navbar";
import ChatWithJournal from "@/components/chat/ChatWithJournal";
import { MessageCircle } from "lucide-react";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";

const JournalEditor = dynamic(
  () => import("@/app/components/JournalEditor"),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-cal-poly-green-200 dark:bg-cal-poly-green-600 rounded-lg h-[300px] flex items-center justify-center">
        <span className="text-cal-poly-green-500 dark:text-cal-poly-green-400">Loading editor...</span>
      </div>
    )
  }
);


type BlockNoteContent = {
    type: string;
    content?: {text: string}[];
    children?: BlockNoteContent[];
    props?: {
        url?: string;
        alt?: string;
        name?: string;
        mime?: string;
        type?: string;
    };
}

type EntryRow = {
  id: string,
  entry_date: string,
  content: BlockNoteContent[],
  created_at: string
}

const isTodayCheck = (date: Date) => {
  if (!date) return false;
  return format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
}

const JOURNAL_ENTRIES_TABLE = 'journal_entries';

export default function Journal() {

  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [draft, setDraft] = useState<BlockNoteContent[]>([]);  // current editor JSON

  
  const { user, loading } = useUser();
  const router = useRouter();


  useEffect(() => {
    if(!loading && user === null){
      router.push('/login');
    }
  }, [user, loading, router]);
  
  
  useEffect(() => {
      fetchEntries();
    }, []);
    
    if(loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  async function fetchEntries() {
    const { data, error } = await supabase
    .from<"journal_entries", EntryRow>(JOURNAL_ENTRIES_TABLE)
    .select('*')
    .order('created_at', {ascending:false})

    if(error){
      console.log('Fetch error: ', error);
    }

    if(data){
      setEntries(data);
    }
  }

  async function handleSave(){
    if(!selectedDate) return ;

    // Use local date directly to avoid timezone issues
    const dateKey = format(selectedDate, "yyyy-MM-dd");

    const { error } = await supabase.from(JOURNAL_ENTRIES_TABLE).upsert(
        {
            user_id:    user!.id,
            entry_date: dateKey,
            content:    draft, 
        },
        { onConflict: "user_id,entry_date" },
    );

    if(error){
        console.log(error);   
    }

    await fetchEntries();
  }

  const todaysEntry = entries.find(
    (e) => {
      if (!selectedDate) return false;
      return e.entry_date === format(selectedDate, "yyyy-MM-dd");
    }
  );

  // Fuerza al editor a remountear cuando cambia el dia o el entry.
  const editorInstanceKey = `${selectedDate?.toISOString() ?? 'none'}-${todaysEntry?.id ?? 'new'}`;


  function ReadOnlyNote({ content }: { content: BlockNoteContent[] }) {
    const editor = useCreateBlockNote({ 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialContent: content as any 
    });
    return <BlockNoteView editor={editor} editable={false} />;
  }

  const handleSignOut = async() => {
    await supabase.auth.signOut();
    router.push('/');
  }

  
    

  const entryDates = entries.map((entry) => {
    // Parse date string as local date, not UTC
    const [year, month, day] = entry.entry_date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day); // month is 0-indexed
    return localDate;
  });


  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 transition-colors relative">
      <Navbar 
        onSignOut={handleSignOut}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-12">
          {/* Sidebar */}
          <aside className="col-span-3 -ml-4 sm:-ml-6 md:-ml-8 pr-4 md:pr-6 lg:pr-10">
            <div className="sticky top-8 space-y-8">
              {/* Calendar */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                  <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
                    Calendar
                  </h2>
                </div>
                <div className="bg-white/70 dark:bg-gray-950/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 dark:border-gray-800/60">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="border-0 bg-transparent shadow-none"
                    modifiers={{
                      hasEntry: (date) =>
                        entryDates.some(entry =>
                          entry.getFullYear() === date.getFullYear() &&
                          entry.getMonth() === date.getMonth() &&
                          entry.getDate() === date.getDate()
                        )
                    }}
                    modifiersClassNames={{
                      hasEntry: ""
                    }}
                    entries={entryDates}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                  <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
                    Overview
                  </h2>
                </div>
              <div className="space-y-3 bg-white/70 dark:bg-gray-950/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/60 dark:border-gray-800/60">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-white">Total entries</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{entries.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-white">Selected</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedDate ? format(selectedDate, "MMM d") : "None"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="col-span-9 space-y-12">
            {/* Editor Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-[hsl(var(--primary))]">
                    {todaysEntry ? "Edit Entry" : "New Entry"}
                  </h1>
                  <p className="text-sm text-white">
                    {selectedDate
                      ? `Writing for ${format(selectedDate, "MMMM do, yyyy")}`
                      : "Write about your day"}
                  </p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={!selectedDate || !isTodayCheck(selectedDate)}
                  className="px-6 py-3 bg-[hsl(var(--primary))] hover:brightness-110 disabled:bg-gray-200 dark:disabled:bg-gray-800 text-[hsl(var(--primary-foreground))] disabled:text-gray-400 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 disabled:cursor-not-allowed shadow-sm"
                >
                  Save Entry
                </button>
              </div>

              {/* Rich-text editor */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm min-h-[500px] overflow-hidden">
                <JournalEditor
                  key={editorInstanceKey}
                  initialContent={todaysEntry?.content}
                  onChange={setDraft}
                />
              </div>
            </section>

            {/* Recent Entries Feed */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                  <h2 className="text-xl font-bold text-white">
                    Recent Entries
                  </h2>
                </div>
                <div className="px-3 py-1 bg-[hsl(var(--primary)/0.08)] rounded-full border border-[hsl(var(--primary)/0.2)]">
                  <span className="text-xs font-medium text-[hsl(var(--primary))]">
                    {entries.length} entries
                  </span>
                </div>
              </div>

              {entries.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Start Your Journey
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Begin writing your first journal entry to capture your thoughts and memories.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 max-h-[600px] overflow-y-auto">
                  {entries.map((entry, index) => (
                    <article key={entry.id} className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 hover:shadow-lg overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                              {format(new Date(entry.entry_date + 'T00:00:00'), "MMMM do, yyyy")}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(entry.created_at), "MMM do 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                        <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                          <ReadOnlyNote content={entry.content} />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {/* Floating Chat Toggle */}
      <FloatingChat />
    </main>
  );
}

function FloatingChat(){
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-0">
      <div
        className={`${open ? 'w-[460px] h-[660px] rounded-2xl' : 'w-14 h-14 rounded-full'} ${open ? 'bg-white dark:bg-gray-900' : 'bg-white/70 dark:bg-gray-900/60'} backdrop-blur-md border ${open ? 'border-2 border-[hsl(var(--primary))]' : 'border-white/40 dark:border-white/10'} ${open ? 'shadow-2xl ring-2 ring-[hsl(var(--primary)/0.2)]' : 'shadow-2xl ring-1 ring-black/5'} transition-all duration-300 ease-out overflow-hidden flex items-end justify-end`}
      >
        {/* Inner content morphs in */}
        {open ? (
          <div className="w-full h-full flex flex-col">
            <ChatWithJournal compact frameless className="w-full h-full" onClose={() => setOpen(false)} title="Chat" />
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="w-14 h-14 rounded-full bg-[hsl(var(--primary))] hover:brightness-110 text-[hsl(var(--primary-foreground))] shadow-xl flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2"
            aria-label="Open chat"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
