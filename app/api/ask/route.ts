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

// Intent detection for better responses
type Intent = "media_request" | "entry_lookup" | "general";

function detectIntent(question: string): Intent {
    const s = question.toLowerCase();
    
    // More comprehensive media request detection
    const mediaWords = /(foto|fotos|imagen|imágenes|imagenes|media|picture|pictures|photos|muestra|muéstrame|envia|envía|ver|quiero\s+ver|mostrar|mostrarme|enseña|enseñame|enseñar)/.test(s);
    
    // Detect requests for specific content with images
    const contentWithImages = /(qué\s+(hice|pasó|ocurrió|comí|bebí|vi|fui|estuve)|que\s+(hice|paso|ocurrio|comi|bebi|vi|fui|estuve)|cómo\s+(estaba|estuve|fue)|como\s+(estaba|estuve|fue)|dónde\s+(estuve|fui|estaba)|donde\s+(estuve|fui|estaba))/.test(s);
    
    // Detect date-specific requests
    const dateRequest = /(ayer|hoy|mañana|esta\s+semana|la\s+semana\s+pasada|el\s+mes\s+pasado|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|\d{1,2}\s+de\s+\w+)/.test(s);
    
    if (mediaWords || (contentWithImages && dateRequest)) return "media_request";
    if (contentWithImages) return "entry_lookup";
    return "general";
}

// Extract and parse dates from user questions
function extractDateFromQuestion(question: string): string | null {
    const s = question.toLowerCase();
    
    // Handle relative dates first
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (s.includes('ayer')) {
        return yesterday.toISOString().split('T')[0];
    }
    if (s.includes('hoy')) {
        return today.toISOString().split('T')[0];
    }
    if (s.includes('mañana')) {
        return tomorrow.toISOString().split('T')[0];
    }
    
    // Handle "esta semana" and "la semana pasada"
    if (s.includes('esta semana')) {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return startOfWeek.toISOString().split('T')[0];
    }
    if (s.includes('la semana pasada') || s.includes('semana pasada')) {
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        return lastWeek.toISOString().split('T')[0];
    }
    
    // Look for patterns like "22 de agosto", "22 agosto", "agosto 22", etc.
    const datePatterns = [
        // "22 de agosto de 2025" or "22 de agosto"
        /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?/,
        // "22 agosto 2025" or "22 agosto"
        /(\d{1,2})\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+(\d{4}))?/,
        // "agosto 22, 2025" or "agosto 22"
        /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{1,2})(?:,\s+(\d{4}))?/
    ];
    
    const monthNames = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
        'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
        'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    };
    
    for (const pattern of datePatterns) {
        const match = s.match(pattern);
        if (match) {
            let day, month, year;
            
            if (pattern === datePatterns[0] || pattern === datePatterns[1]) {
                // "22 de agosto" or "22 agosto"
                day = match[1];
                month = monthNames[match[2] as keyof typeof monthNames];
                year = match[3] || new Date().getFullYear().toString();
            } else {
                // "agosto 22"
                month = monthNames[match[1] as keyof typeof monthNames];
                day = match[2];
                year = match[3] || new Date().getFullYear().toString();
            }
            
            return `${year}-${month}-${day.padStart(2, '0')}`;
        }
    }
    
    return null;
}

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

    // Detect intent and handle media requests specially
    const intent = detectIntent(question);
    
    // Extract date from question if present
    const questionDate = extractDateFromQuestion(question);
    
    // Calculate relevance scores and find most relevant entries
    const entriesWithRelevance = entries.map(entry => {
        const text = blockNoteToPlainText(entry.content);
        let relevance = calculateRelevance(text, question);
        
        // Boost relevance if the entry date matches the question date
        if (questionDate && entry.entry_date === questionDate) {
            relevance = Math.max(relevance, 0.8); // High relevance for exact date match
        }
        
        const imageUrls = extractImageUrls(entry.content);
        return {
            ...entry,
            text,
            relevance,
            imageUrls
        };
    });

    // Sort by relevance and get top 10 most relevant entries
    const relevantEntries = entriesWithRelevance
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 10);

    // Handle media requests - return direct image URLs prioritizing date/keywords
    if (intent === "media_request") {
        const stopwords = new Set([
            'de','del','la','el','los','las','en','y','o','a','un','una','unos','unas','que','mi','mis','mio','mía','mias','míos','sobre','para','por','con','al','lo','foto','fotos','imagen','imágenes','imagenes','media','picture','pictures','photos','muestra','muéstrame','envia','envía','ver','quiero'
        ]);
        const loweredQuestion = question.toLowerCase();
        const keywords = loweredQuestion
            .split(/[^a-záéíóúñü0-9]+/i)
            .filter((w: string) => w.length > 2 && !stopwords.has(w));

        // Get all entries with images
        let candidates = entriesWithRelevance.filter(e => e.imageUrls.length > 0);

        if (candidates.length === 0) {
            return NextResponse.json({
                answer: "No encontré imágenes en tus entradas del journal."
            });
        }

        // If user asked for a specific date, prioritize exact date matches
        if (questionDate) {
            const exactDateMatches = candidates.filter(e => e.entry_date === questionDate);
            if (exactDateMatches.length > 0) {
                candidates = exactDateMatches;
            } else {
                // If no exact date match, look for nearby dates (within 3 days)
                const targetDate = new Date(questionDate);
                candidates = candidates.filter(e => {
                    const entryDate = new Date(e.entry_date);
                    const diffDays = Math.abs((targetDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
                    return diffDays <= 3;
                });
            }
        }

        // If still no candidates after date filtering, use all entries with images
        if (candidates.length === 0) {
            candidates = entriesWithRelevance.filter(e => e.imageUrls.length > 0);
        }

        // Calculate better relevance scores
        candidates = candidates.map(e => {
            const text = e.text.toLowerCase();
            let score = e.relevance; // Base relevance from text matching
            
            // Boost score for keyword matches in text
            const keywordHits = keywords.reduce((acc: number, k: string) => {
                const matches = (text.match(new RegExp(k, 'g')) || []).length;
                return acc + matches;
            }, 0);
            
            // Boost score for date proximity if no exact date match
            if (questionDate && e.entry_date !== questionDate) {
                const targetDate = new Date(questionDate);
                const entryDate = new Date(e.entry_date);
                const diffDays = Math.abs((targetDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
                score += Math.max(0, 0.5 - (diffDays * 0.1)); // Closer dates get higher scores
            }
            
            // Boost score for exact date match
            if (questionDate && e.entry_date === questionDate) {
                score += 1.0;
            }
            
            // Boost score for keyword matches
            score += keywordHits * 0.4;
            
            // Boost score for more recent entries (within last 30 days)
            const entryDate = new Date(e.entry_date);
            const now = new Date();
            const daysDiff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff <= 30) {
                score += 0.2;
            }
            
            return { ...e, mediaScore: score } as typeof e & { mediaScore: number };
        });

        // Sort by media score and get top candidates
        candidates.sort((a, b) => b.mediaScore - a.mediaScore);
        
        // Get top 3 candidates to show variety
        const topCandidates = candidates.slice(0, 3);
        
        if (topCandidates.length === 0) {
            return NextResponse.json({
                answer: "No encontré imágenes relevantes para tu consulta."
            });
        }

        // Format response with better context
        let response = "";
        if (topCandidates.length === 1) {
            const chosen = topCandidates[0];
            const imageList = chosen.imageUrls.map(url => `![Imagen](${url})`).join('\n');
            response = `Aquí están las imágenes de ${chosen.entry_date}:\n\n${imageList}`;
        } else {
            response = "Encontré estas imágenes relevantes:\n\n";
            topCandidates.forEach((candidate) => {
                const imageList = candidate.imageUrls.map(url => `![Imagen](${url})`).join('\n');
                response += `**${candidate.entry_date}:**\n${imageList}\n\n`;
            });
        }

        return NextResponse.json({
            answer: response
        });
    }

    // Create context for AI (use only top relevant entries for better focus)
    const context = relevantEntries
        .filter(e => e.relevance > 0.1)
        .map(e => `- ${e.entry_date}: ${e.text}`)
        .join("\n");

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

        Answer:
        `;
    const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt
    });

    return NextResponse.json({ answer: text });
}