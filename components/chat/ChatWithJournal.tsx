
"use client";

import { useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { format } from "date-fns";
import Image from "next/image";
import FileUpload from "../FileUpload";
import { X } from "lucide-react";

type JournalEntry = {
    id: string;
    entry_date: string;
    content: any; // BlockNote content
    created_at: string;
};

type Message = {
    role: "user" | "assistant";
    content: string;
    attachments?: Array<{
        url: string;
        type: string;
        name?: string;
    }>;
};

// Component to render BlockNote content in chat
function ChatJournalEntry({ entry }: { entry: JournalEntry }) {
    const editor = useCreateBlockNote({ 
        initialContent: entry.content
    });
    
    return (
        <div className="p-3 bg-khaki-50/80 dark:bg-cal-poly-green-800/80 rounded-lg border border-cal-poly-green-200 dark:border-cal-poly-green-600 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cal-poly-green-100 dark:border-cal-poly-green-700">
                <div className="w-2 h-2 bg-khaki-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs font-medium text-cal-poly-green-600 dark:text-cal-poly-green-300 font-serif">
                    {format(new Date(entry.entry_date), "MMM do, yyyy")}
                </span>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert [&_.bn-editor]:text-sm [&_.bn-editor]:leading-relaxed [&_img]:max-w-[200px] [&_img]:h-auto [&_img]:rounded-md [&_img]:border [&_img]:border-cal-poly-green-200 [&_img]:dark:border-cal-poly-green-600 [&_img]:shadow-sm [&_p]:mb-2 [&_p:last-child]:mb-0">
                <BlockNoteView editor={editor} editable={false} />
            </div>
        </div>
    );
}

// Component to render attachments
function AttachmentPreview({ attachment, onRemove }: { 
    attachment: { url: string; type: string; name?: string }; 
    onRemove: () => void;
}) {
    return (
        <div className="relative group">
            {attachment.type.startsWith('image/') ? (
                <Image 
                    src={attachment.url} 
                    alt={attachment.name || 'Uploaded image'}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    unoptimized={attachment.url.includes('supabase.co')}
                />
            ) : attachment.type.startsWith('video/') ? (
                <video 
                    src={attachment.url}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    controls={false}
                />
            ) : null}
            <button
                onClick={onRemove}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}

// Component to render markdown content with images
function MarkdownContent({ content }: { content: string }) {
    // Split content by markdown images
    const parts = content.split(/(!\[.*?\]\([^)]+\))/g);
    
    return (
        <div className="space-y-3">
            {parts.map((part, index) => {
                // Check if this part is a markdown image
                const imageMatch = part.match(/!\[(.*?)\]\(([^)]+)\)/);
                if (imageMatch) {
                    const [, alt, url] = imageMatch;
                    return (
                        <div key={index} className="flex justify-center">
                            <div className="relative max-w-full max-h-96">
                                <Image 
                                    src={url} 
                                    alt={alt || 'Image'}
                                    width={800}
                                    height={600}
                                    className="max-w-full max-h-96 object-contain rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
                                    unoptimized={url.includes('supabase.co')} // Disable optimization for Supabase URLs
                                    onError={(e) => {
                                        console.log('Image failed to load:', url);
                                        // Fallback to regular img tag if Next.js Image fails
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const fallback = document.createElement('img');
                                        fallback.src = url;
                                        fallback.alt = alt || 'Image';
                                        fallback.className = 'max-w-full max-h-96 object-contain rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm';
                                        target.parentNode?.appendChild(fallback);
                                    }}
                                />
                            </div>
                        </div>
                    );
                }
                // Regular text content
                if (part.trim()) {
                    return (
                        <p key={index} className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {part}
                        </p>
                    );
                }
                return null;
            })}
        </div>
    );
}

type ChatWithJournalProps = {
    compact?: boolean;
    className?: string;
    onClose?: () => void;
    title?: string;
    frameless?: boolean;
};

export default function ChatWithJournal({ compact = false, className = "", onClose, title, frameless = false }: ChatWithJournalProps){
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [attachments, setAttachments] = useState<Array<{ url: string; type: string; name?: string }>>([]);


    const handleChange = (value: string):void => {
        setInput(value);
    }

    const handleFileUpload = (url: string, type: string) => {
        setAttachments(prev => [...prev, { url, type }]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    async function handleSubmit(){
        if(!input.trim() && attachments.length === 0) return ;
        
        const userMessage: Message = { 
            role: "user", 
            content: input,
            attachments: attachments.length > 0 ? [...attachments] : undefined
        };
        setMessages(prevMsg => [...prevMsg, userMessage]);
        setInput('');
        setAttachments([]);
        setLoading(true);

        try {
            // recentHistory son los ultimos mensajes de chat
            const recentHistory = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    question: input,
                    attachments: attachments.length > 0 ? attachments : undefined,
                    history: recentHistory    // contexto de chat
                }),
            })

            const data = await res.json();

            const aiMessage: Message = { 
                role: "assistant", 
                content: data.answer
            };
            setMessages(prevMsg => [...prevMsg, aiMessage]);
        } catch (err) {
            // swallow
        } finally {
            setLoading(false);
        }


    }
    
    const compactBase = frameless
        ? "flex flex-col w-[460px] h-[600px] rounded-2xl overflow-hidden"
        : "flex flex-col w-[460px] h-[600px] bg-white/70 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-white/10 shadow-2xl ring-1 ring-black/5 overflow-hidden";
    const containerClasses = compact
        ? compactBase
        : "flex flex-col h-[calc(100vh-200px)] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden";

    return (
        <div className={`${containerClasses} ${className}`.trim()}>
            {/* Optional Header (compact) */}
            {(compact || onClose) && (
                <div className={`${frameless ? 'border-transparent bg-transparent backdrop-blur-0' : 'border-white/50 dark:border-white/10 bg-white/40 dark:bg-gray-900/30 backdrop-blur-sm'} flex items-center justify-between px-4 py-3 border-b`}>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        <span className="text-sm font-serif font-semibold text-gray-900 dark:text-white">{title || 'Chat'}</span>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-md transition-colors focus:outline-none ${frameless ? 'hover:bg-white/10' : 'hover:bg-white/50 dark:hover:bg-white/10'}`}
                            aria-label="Close"
                        >
                            <X className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        </button>
                    )}
                </div>
            )}
            {/* Messages Container */}
            <div className={`flex-1 overflow-y-auto ${compact ? 'px-5 py-4' : 'px-6 py-4'}`}>
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-600 dark:text-gray-400">
                            <div className={`${compact ? 'text-3xl' : 'text-4xl'} mb-2`}>💭</div>
                            <p className={`${compact ? 'text-sm' : 'text-base'} font-serif font-semibold text-gray-900 dark:text-white mb-1`}>Chat with your journal</p>
                            <p className={`${compact ? 'text-xs' : 'text-sm'} font-serif text-gray-700 dark:text-gray-300`}>Ask questions about your entries or share images/videos</p>
                        </div>
                    </div>
                )}
                
                <div className="space-y-3">
                    {messages.map((message, id) => (
                        <div 
                            key={id}
                            className={`flex ${message.role === "user" ? 'justify-end pl-12' : 'justify-start pr-12'}`}
                        >
                            <div 
                                className={`px-4 py-2.5 rounded-2xl max-w-full ${
                                    message.role === "user" 
                                        ? 'bg-blue-600 text-white rounded-br-sm shadow-sm' 
                                        : 'bg-white/70 dark:bg-gray-700/70 backdrop-blur border border-gray-200/60 dark:border-gray-600/60 text-gray-900 dark:text-white rounded-bl-sm shadow-sm'
                                }`}
                            >
                                {message.role === "assistant" ? (
                                    <MarkdownContent content={message.content} />
                                ) : (
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                                )}
                                
                                {/* Show attachments for user messages */}
                                {message.role === "user" && message.attachments && message.attachments.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {message.attachments.map((attachment, idx) => (
                                            <AttachmentPreview 
                                                key={idx}
                                                attachment={attachment}
                                                onRemove={() => {}} // No remove in sent messages
                                            />
                                        ))}
                                    </div>
                                )}
                                
                            </div>
                        </div>
                    ))}
                    
                    {loading && (
                        <div className="flex justify-start pr-12">
                            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                                <div className="flex items-center space-x-2">
                                    <div className="flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                        <div className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                        <div className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Input Container */}
            <div className={`border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 ${compact ? 'px-4 py-3' : 'px-6 py-4'}`}>
                {/* Attachments Preview */}
                {attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {attachments.map((attachment, index) => (
                            <AttachmentPreview 
                                key={index}
                                attachment={attachment}
                                onRemove={() => removeAttachment(index)}
                            />
                        ))}
                    </div>
                )}
                
                <div className="flex items-end space-x-3 max-w-full">
                    <FileUpload 
                        onFileUpload={handleFileUpload}
                        disabled={loading}
                        className="flex-shrink-0"
                        variant={compact ? 'icon' : 'default'}
                    />
                    <textarea
                        value={input}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={loading}
                        placeholder={compact ? 'Message...' : 'Ask about your journal entries or share images/videos...'}
                        className={`flex-1 resize-none rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors min-h-[38px] max-h-24 ${compact ? 'bg-white/90 dark:bg-gray-800/90 border border-gray-300 dark:border-gray-600' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'}`}
                        rows={1}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = Math.min(target.scrollHeight, 96) + 'px';
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!loading && (input.trim() || attachments.length > 0)) {
                                    handleSubmit();
                                }
                            }
                        }}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={loading || (!input.trim() && attachments.length === 0)}
                        className={`text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] ${compact ? 'bg-[hsl(var(--primary))] hover:brightness-110 disabled:bg-gray-300/70 dark:disabled:bg-gray-600/70 focus:ring-offset-0' : 'bg-[hsl(var(--primary))] hover:brightness-110 disabled:bg-gray-300 dark:disabled:bg-gray-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800'} disabled:cursor-not-allowed flex items-center justify-center min-w-[52px] h-[38px] shadow-sm`}
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}