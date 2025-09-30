import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServerSupabaseClientFromRequest } from "@/lib/supabase";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";



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

// Removed unused JournalEntry type

// Removed hardcoded intent detection - now handled by AI model

// Removed hardcoded date extraction - now handled by AI model

// Extract image URLs from BlockNote content
function extractImageUrls(content: BlockNoteContent[]): string[] {
    if (!Array.isArray(content)) return [];
    const urls: string[] = [];
    
    const walk = (blocks: BlockNoteContent[]) => {
        for (const block of blocks) {
            if (block?.type === 'image' && block?.props?.url) {
                urls.push(block.props.url);
            }
            if (Array.isArray(block?.children) && block.children.length) {
                walk(block.children);
            }
        }
    };
    
    walk(content);
    console.log('Total URLs extracted:', urls);
    return urls;
}


export async function POST(req: Request){
    const { question, attachments, history = [] }: {
        question: string;
        attachments?: Array<{ type: string; url: string }>;
        history?: Array<{ role: string; content: string }>;
    } = await req.json();
    
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ answer: "Missing OpenAI API key." }, { status: 500 });
    }

    // Create server-side Supabase client with user session
    // Try the new method first, fallback to the old one
    let supabase;
    let user;
    let authError;
    
    try {
        supabase = await createServerSupabaseClientFromRequest(req);
        const authResult = await supabase.auth.getUser();
        user = authResult.data.user;
        authError = authResult.error;
    } catch {
        // Fallback to the original method
        try {
            supabase = await createServerSupabaseClient();
            const authResult = await supabase.auth.getUser();
            user = authResult.data.user;
            authError = authResult.error;
        } catch (fallbackError) {
            console.error('Supabase auth error:', fallbackError);
            return NextResponse.json({ 
                answer: "Authentication error. Please try logging in again." 
            }, { status: 401 });
        }
    }
    
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
    .limit(300);

    if(error || !entries){
        return NextResponse.json({ answer: "Hubo un problema sorry" });
    }

    // Prepare all journal entries for the AI model to analyze
    const entriesWithContent = entries.map(entry => {
        console.log('Processing entry:', entry.entry_date);
        
        const text = blockNoteToPlainText(entry.content);
        const imageUrls = extractImageUrls(entry.content);
        
        console.log('Extracted text:', text.substring(0, 100) + '...');
        console.log('Extracted image URLs:', imageUrls);
        
        return {
            ...entry,
            text,
            imageUrls
        };
    });

    // Create context for AI with all relevant information
    const context = entriesWithContent
        .map(e => {
            let entryText = `- ${e.entry_date}: ${e.text}`;
            if (e.imageUrls.length > 0) {
                entryText += `\n  Imágenes disponibles: ${e.imageUrls.join(', ')}`;
            }
            return entryText;
        })
        .join("\n");

    console.log( "context", context);

    // Build prompt with attachments if provided
    let attachmentContext = "";
    if (attachments && attachments.length > 0) {
        attachmentContext = `
        
        ### User has shared ${attachments.length} media file(s):
        ${attachments.map((att: { type: string; url: string }, index: number) => 
            `- File ${index + 1}: ${att.type.startsWith('image/') ? 'Image' : 'Video'} - ${att.url}`
        ).join('\n')}
        
        Please consider these media files in your response. If they are images, describe what you see and how they might relate to the journal entries. If they are videos, acknowledge them and ask if the user wants to discuss the content.
        `;
    }
  

    const chatHistory = Array.isArray(history) && history.length > 0
        ? history
            .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${typeof m.content === 'string' ? m.content : ''}`)
            .join('\n')
        : '';

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

        ### Special Instructions:
        - If the user asks for images, photos, or media from their journal, include the image URLs in your response using markdown format: ![Description](URL)
        - IMPORTANT: Only use the exact image URLs provided in the "Imágenes disponibles" section of the journal context. Copy them exactly as they appear.
        - If the user asks about specific dates (like "ayer", "hoy", "22 de agosto"), focus on entries from those dates
        - If the user asks about patterns or trends, analyze the entries to identify them
        - If the user wants to see specific content, prioritize the most relevant entries
        - Always be helpful and provide context about when entries were written

        ### Data:
        Journal Context:
        ${context}
        ${attachmentContext}

        ${chatHistory ? `### Conversation so far (recent turns):\n${chatHistory}` : ''}

        User Question:
        ${question}

        ### Task:
        Provide a clear, reflective, and helpful answer for the user based only on the journal context above.
        Format your answer as a natural conversation.
        If the user is asking for images or media, include the relevant image URLs in markdown format.

        Answer:
        `;
    const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt
    });

    return NextResponse.json({ answer: text });
}