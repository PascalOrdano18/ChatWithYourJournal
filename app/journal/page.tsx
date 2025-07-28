

'use client'

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

type Entry = {
  id: string,
  entry_date: string,
  text: string,
  created_at: string
}


export default function Journal() {

  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [value, setValue] = useState('');
//   const [loading, setLoading] = useState(false);

  const JOURNAL_ENTRIES_TABLE = 'journal_entries';
  const { user, loading } = useUser();
  const router = useRouter();


  useEffect(() => {
    if(!loading && user === null){
      router.push('/login');
    }
    fetchEntries();
  }, [user, loading, router]);

  if(loading || !user) return null;


  


  async function fetchEntries() {
    const { data, error } = await supabase
    .from(JOURNAL_ENTRIES_TABLE)
    .select('*')
    .order('created_at', {ascending:false})

    if(error){
      console.log('Fetch error: ', error);
    }

    if(data){
      setEntries(data);
    }
  }

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault();

    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase.from(JOURNAL_ENTRIES_TABLE).insert({
      text: value,
      entry_date: today,
    });

    if(error){
      console.log("Error on submit: ", error);
    }

    setValue('');
    fetchEntries();
  }


  const handleSignOut = async() => {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 md:px-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">My Journal</h1>
          <p className="text-gray-500 text-sm mt-1">Today is {/* you can render date here */}</p>
          <button
                onClick={handleSignOut}
                className="mt-2 text-sm text-blue-600 underline hover:text-blue-800"
                >
                Sing Out
          </button>
        </header>
        <section className="bg-white shadow-md rounded-xl p-6 space-y-4">
            <div className="bg-white rounded-xl shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Select a Day</h2>
                <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                />
            </div>
          <h2 className="text-xl font-semibold text-gray-700">New Entry</h2>
          <form className="space-y-4" onSubmit={(e) => handleSubmit(e)}>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              rows={5}
              placeholder="Write something about your day..."
              value={value}
              onChange={(e) => {setValue(e.target.value)}}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              Save Entry
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Entries</h2>

          {/* Loop over your entries here */}
          {entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <p className="text-gray-800">{entry.text}</p>
                <p className="text-xs text-gray-400 mt-2">Posted at {new Date(entry.created_at).toLocaleTimeString()}</p>
              </div>
          ))}
          

          {/* You can map over entries */}
        </section>
      </div>
    </main>

    
  );
}
