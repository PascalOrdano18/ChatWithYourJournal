"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { format } from "date-fns";

import { supabase }  from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { Calendar } from "@/components/ui/calendar";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";

const JournalEditor = dynamic(
    () => import("@/app/components/JournalEditor"),
  { ssr: false }   
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
  const [value, setValue] = useState('');
  const [draft, setDraft] = useState<any>([]);  // current editor JSON

  const JOURNAL_ENTRIES_TABLE = 'journal_entries';
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
    
    if(loading || !user) return null;

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


  const handleSignOut = async() => {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <header className="text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">My Journal</h1>
          <p className="text-lg text-gray-600">
            {format(new Date(), "EEEE, MMMM do, yyyy")}
          </p>
          <button
            onClick={handleSignOut}
            className="mt-4 text-sm text-blue-600 underline hover:text-blue-800 transition-colors"
          >
            Sign Out
          </button>
        </header>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ─── Calendar column ──────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-6">
                <h2 className="mb-1 text-xl font-semibold text-gray-800">
                  Select a Day
                </h2>
                <p className="text-sm text-gray-500">
                  Choose a date to view or create entries
                </p>
              </div>
              <div className="flex min-h-[400px] flex-col p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="flex-1 border-0 bg-transparent p-1 shadow-none"
                />
              </div>
            </div>
          </div>

          {/* ─── Main content column ──────────────────────────── */}
          <div className="space-y-6 lg:col-span-2">
            {/* Editor Card */}
            <section className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {todaysEntry ? "Edit Entry" : "New Entry"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedDate
                    ? `Writing for ${format(selectedDate, "MMMM do, yyyy")}`
                    : "Write about your day"}
                </p>
              </div>

              {/* Rich-text editor */}
              <JournalEditor
                key={selectedDate?.toISOString()}        /* remount on day change */
                initialContent={todaysEntry?.content ?? []}
                onChange={setDraft}
              />

              <button
                onClick={handleSave}
                disabled={draft.length === 0}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
              >
                Save Entry
              </button>
            </section>

            {/* Recent entries */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Recent Entries
                </h2>
                <span className="text-sm text-gray-500">
                  {entries.length} total entries
                </span>
              </div>

              {entries.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
                  No entries yet. Start writing your first journal entry!
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                      {/* read-only BlockNote view */}
                      <BlockNoteView
                        editor={useCreateBlockNote({
                          initialContent: entry.content,
                        })}
                        readOnly
                      />
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>
                          Entry date:{" "}
                          {format(new Date(entry.entry_date), "MMM do, yyyy")}
                        </span>
                        <span>
                          Created:{" "}
                          {format(new Date(entry.created_at), "MMM do, h:mm a")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
