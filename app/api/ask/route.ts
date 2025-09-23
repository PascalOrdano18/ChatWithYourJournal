import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { generateText } from "ai"
import { google } from "@ai-sdk/google"



type BlockNoteContent = {
    type: string;
    content?: {text: string}[];
    children?: unknown[];
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

// Simple relevance scoring based on keyword matching
const calculateRelevance = (entryText: string, question: string): number => {
    const questionWords = question.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const entryWords = entryText.toLowerCase().split(/\s+/);
    
    let matches = 0;
    questionWords.forEach(qWord => {
        if (entryWords.some(eWord => eWord.includes(qWord) || qWord.includes(eWord))) {
            matches++;
        }
    });
    
    return matches / questionWords.length;
}

type JournalEntry = {
    id: string;
    entry_date: string;
    content: any;
    created_at: string;
}


export async function POST(req: Request){
    const { question, attachments } = await req.json();
    
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return NextResponse.json({ answer: "Missing Gemini API key." }, { status: 500 });
    }

    // Create server-side Supabase client with user session
    const supabase = await createServerSupabaseClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
        return NextResponse.json({ 
            answer: "You must be logged in to chat with your journal." 
        }, { status: 401 });
    }

    // Query journal entries for the authenticated user
    const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('id, entry_date, content, created_at')
    .eq('user_id', user.id)  // Filter by authenticated user's ID
    .order('entry_date', { ascending: false })
    .limit(30);

    if(error || !entries){
        return NextResponse.json({ answer: "Hubo un problema sorry" });
    }

    // Calculate relevance scores and find most relevant entries
    const entriesWithRelevance = entries.map(entry => {
        const text = blockNoteToPlainText(entry.content);
        const relevance = calculateRelevance(text, question);
        return {
            ...entry,
            text,
            relevance
        };
    });

    // Sort by relevance and get top 5 most relevant entries
    const relevantEntries = entriesWithRelevance
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5);

    // Create context for AI (still using all entries for broader context)
    const context = entriesWithRelevance
        .map(e => `- ${e.entry_date}: ${e.text}`)
        .filter(Boolean)
        .join("\n");

    // Build prompt with attachments if provided
    let attachmentContext = "";
    if (attachments && attachments.length > 0) {
        attachmentContext = `
        
        ### User has shared ${attachments.length} media file(s):
        ${attachments.map((att: any, index: number) => 
            `- File ${index + 1}: ${att.type.startsWith('image/') ? 'Image' : 'Video'} - ${att.url}`
        ).join('\n')}
        
        Please consider these media files in your response. If they are images, describe what you see and how they might relate to the journal entries. If they are videos, acknowledge them and ask if the user wants to discuss the content.
        `;
    }
  

    const prompt = `
        You are an empathetic and insightful journal companion. 
        Your role is to help the user reflect on their past journal entries, find patterns, and answer questions about their experiences. 

        ### Guidelines:
        - Always ground your answers in the given journal context. 
        - Be concise, thoughtful, and conversational — like a supportive friend who also analyzes patterns.
        - If the context is insufficient, say so and offer what could be asked or clarified.
        - Avoid hallucinating: do not invent details that are not in the journal.
        - If the user asks for advice, base it only on the context provided.
        - If the user shares media files, acknowledge them and provide relevant insights based on the journal context.

        ### Data:
        Journal Context:
        ${context}
        ${attachmentContext}

        User Question:
        ${question}

        ### Task:
        Provide a clear, reflective, and helpful answer for the user based only on the journal context above.
        Format your answer as a natural conversation.

        Answer:
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

    // Filter relevant entries to only include those with some relevance (> 0)
    const entriesToReturn = relevantEntries
        .filter(entry => entry.relevance > 0)
        .slice(0, 3) // Limit to top 3 most relevant
        .map(entry => ({
            id: entry.id,
            entry_date: entry.entry_date,
            content: entry.content,
            created_at: entry.created_at
        }));

    return NextResponse.json({
        answer: text,
        relatedEntries: entriesToReturn
    });
}