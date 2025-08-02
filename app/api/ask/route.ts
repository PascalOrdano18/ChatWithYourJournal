import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateText } from "ai"
import { google } from "@ai-sdk/google"



type BlockNoteContent = {
    type: string;
    content?: {text: string}[];
    childer?: any[];
}

const blockNoteToPlainText = (blocks:BlockNoteContent[]): string => {
    return blocks
       .map(block => {
           const text = block.content?.map(span => span.text).join("") ?? "";
           return text.trim();
       })
       .filter(line => line.length > 0)
       .join("\n");
}


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

    console.log("📘 Raw journal entries:", entries);


    if(error || !entries){
        return NextResponse.json({ answer: "Hubo un problema sorry" });
    }

    // ENTRIES ES NULL, TENGO QUE PASAR EL USER ID PORQUE TENGO EL RLS QUE LO PIDE
    const context = entries
    .map(e => {
        console.log("🧱 ENTRY content from Supabase:", e.content); // <-- Add here

      const text = blockNoteToPlainText(e.content); // use directly
      return `- ${e.entry_date}: ${text}`;
    })
    .filter(Boolean)
    .join("\n");
  

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