"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { format, isToday } from "date-fns";

import { supabase }  from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { useTheme } from "@/hooks/useTheme";
import { Calendar } from "@/components/ui/calendar";
import Navbar from "@/app/components/Navbar";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";

const JournalEditor = dynamic(
  () => import("@/app/components/JournalEditor"),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-600 rounded-lg h-[300px] flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400">Loading editor...</span>
      </div>
    )
  }
);


type EntryRow = {
  id: string,
  entry_date: string,
  content: any,
  created_at: string
}

export default function Journal() {

  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [draft, setDraft] = useState<any>([]);  // current editor JSON

  const JOURNAL_ENTRIES_TABLE = 'journal_entries';
  const { user, loading } = useUser();
  const { theme, toggleTheme } = useTheme();
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
    (e) => e.entry_date === format(selectedDate ?? new Date(), "yyyy-MM-dd")
  );


  function ReadOnlyNote({ content }: { content: any }) {
    const editor = useCreateBlockNote({ initialContent: content });
    return <BlockNoteView editor={editor} editable={false} />;
  }

  const handleSignOut = async() => {
    await supabase.auth.signOut();
    router.push('/');
  }

  const isTodayCheck = (date: Date) => {
    if (!date) return false;
    return format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  }
    

  const entryDates = entries.map((entry) => {
    const utcDate = new Date(entry.entry_date);
    const localMidnight = new Date(
      utcDate.getFullYear(),
      utcDate.getMonth(),
      utcDate.getDate()
    );
    return localMidnight;
  });

  console.log("entryDates:", entryDates.map(d => d.toString()));




  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar 
        onSignOut={handleSignOut}
        onToggleTheme={toggleTheme}
        theme={theme}
      />

      <div className="flex gap-8 p-4 md:p-8">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0">
          <div className="sticky top-8 space-y-6">
            {/* Calendar Card */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <div className="border-b border-gray-100 dark:border-gray-700 p-4">
                <h2 className="text-lg font-serif font-semibold text-gray-900 dark:text-white">
                  Select a Day
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-serif mt-1">
                  Choose a date to view or create entries
                </p>
              </div>
              <div className="p-3">
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
                    hasEntry:
                    "relative after:content-[''] after:w-1.5 after:h-1.5 after:bg-emerald-500 after:rounded-full after:absolute after:bottom-[4px] after:left-1/2 after:-translate-x-1/2"

                  }}
                />
              </div>
            </div>

            {/* Entry Stats */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
              <h3 className="text-sm font-serif font-semibold text-gray-900 dark:text-white mb-2">
                Journal Stats
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Total Entries</span>
                  <span className="font-medium">{entries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Entry</span>
                  <span className="font-medium">
                    {selectedDate ? format(selectedDate, "MMM do") : "None"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* Editor Section */}
          <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <div className="border-b border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-white">
                    {todaysEntry ? "Edit Entry" : "New Entry"}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-serif italic mt-1">
                    {selectedDate
                      ? `Writing for ${format(selectedDate, "MMMM do, yyyy")}`
                      : "Write about your day"}
                  </p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={!selectedDate || !isTodayCheck(selectedDate)}
                  className="rounded-lg bg-gray-900 dark:bg-white px-4 py-2 font-serif font-medium text-white dark:text-gray-900 shadow-sm transition-all duration-200 hover:bg-gray-800 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Entry
                </button>
              </div>
            </div>

            {/* Rich-text editor */}
            <div className="p-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-100 dark:border-gray-600 min-h-[300px]">
                <JournalEditor
                  key={selectedDate?.toISOString()}        /* remount on day change */
                  initialContent={todaysEntry?.content}
                  onChange={setDraft}
                />
              </div>
            </div>
          </section>

          {/* Recent Entries Feed */}
          <section className="space-y-6">
            <div className="flex items-center justify-between sticky top-0 bg-gray-50 dark:bg-gray-900 py-4 z-10">
              <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-white">
                Recent Entries
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-serif">
                {entries.length} entries
              </span>
            </div>

            {entries.length === 0 ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center shadow-sm">
                <div className="mx-auto max-w-sm">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-serif font-medium text-gray-900 dark:text-white mb-2">
                    Start Your Journey
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-serif">
                    Begin writing your first journal entry to capture your thoughts and memories.
                  </p>
                </div>
              </div>
            ) : (
              <div className="feed-container space-y-4 pb-8 max-h-[800px] overflow-y-auto">
                {entries.map((entry, index) => (
                  <article
                    key={entry.id}
                    className="feed-post bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    {/* Entry header */}
                    <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 font-serif">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-serif font-medium text-gray-900 dark:text-white">
                            {format(new Date(entry.entry_date), "MMMM do, yyyy")}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-serif">
                            {format(new Date(entry.created_at), "MMM do 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Entry content */}
                    <div className="p-6">
                      <div className="prose prose-journal max-w-none font-serif">
                        <ReadOnlyNote content={entry.content} />
                      </div>
                    </div>
                  </article>
                ))}

                {/* End of entries indicator */}
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-3 text-gray-400 dark:text-gray-600 text-sm font-serif">
                    <div className="w-12 h-px bg-gray-300 dark:bg-gray-600"></div>
                    <span>End of entries</span>
                    <div className="w-12 h-px bg-gray-300 dark:bg-gray-600"></div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </main>
  );
}
