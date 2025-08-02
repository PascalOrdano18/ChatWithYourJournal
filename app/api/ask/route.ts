import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

export async function POST(req: Request){
    const { question } = await req.json();

    const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('entry_date, content')
    .order('entry_date', { ascending: false })
    .limit(30);

    const context = entries
    .map((entry) => {
        `- ${entry.entry_date}: ${entry.content}`
    }).join('\n');

    const prompt = `You are a journal specialist, ready to chat with a user about its journal. Analyze the context given and answer the question
    
        context: ${context}

        question: ${question}

        answer: 
    `;


    return NextResponse.json({
        answer: `la pregunta fue ${question}`
    });
}