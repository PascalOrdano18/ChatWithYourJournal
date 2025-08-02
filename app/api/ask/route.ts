import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(req: Request){
    const { question } = await req.json();
    
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return NextResponse.json({ answer: "Missing Gemini API key." }, { status: 500 });
    }

    const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('entry_date, content')
    .order('entry_date', { ascending: false })
    .limit(30);

    if(error || !entries){
        return NextResponse.json({ answer: "Hubo un problema sorry" });
    }

    const context = entries
    .map(entry => {
        `- ${entry.entry_date}: ${entry.content}`
    }).join('\n');

    const prompt = `You are a journal specialist, ready to chat with a user about its journal. Analyze the context given and answer the question
    
        context: ${context}

        question: ${question}

        answer: 
    `;


    // SI USASE OPENAI
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // const completion = await openai.chat.completions.create({
    //     model: "gpt-3.5-turbo",
    // messages: [
    //   { role: "system", content: "You are a helpful journal assistant." },
    //   { role: "user", content: prompt },
    // ],
    // })
    // const answer = completion.choices[0].message.content;


   const { text } = await generateText({
    model: google("models/gemini-2.0-flash-exp"),
    prompt: prompt
   })

    return NextResponse.json({
        answer: text
    });
}