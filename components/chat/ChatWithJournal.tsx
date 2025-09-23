
"use client";

import { useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { format } from "date-fns";
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
    relatedEntries?: JournalEntry[];
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
        <div className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 font-serif">
                    {format(new Date(entry.entry_date), "MMM do, yyyy")}
                </span>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert [&_.bn-editor]:text-sm [&_.bn-editor]:leading-relaxed [&_img]:max-w-[200px] [&_img]:h-auto [&_img]:rounded-md [&_img]:border [&_img]:border-gray-200 [&_img]:dark:border-gray-600 [&_img]:shadow-sm [&_p]:mb-2 [&_p:last-child]:mb-0">
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
                <img 
                    src={attachment.url} 
                    alt={attachment.name || 'Uploaded image'}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
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

export default function ChatWithJournal(){
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
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    question: input,
                    attachments: attachments.length > 0 ? attachments : undefined
                }),
            })

            const data = await res.json();

            const aiMessage: Message = { 
                role: "assistant", 
                content: data.answer,
                relatedEntries: data.relatedEntries || []
            };
            setMessages(prevMsg => [...prevMsg, aiMessage]);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }


    }
    
    return (
        <div className="flex flex-col h-[calc(100vh-200px)] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-600 dark:text-gray-400">
                            <div className="text-3xl mb-3">💭</div>
                            <p className="text-base font-serif font-semibold text-gray-900 dark:text-white mb-1">Chat with your journal</p>
                            <p className="text-sm font-serif">Ask questions about your entries or share images/videos</p>
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
                                        ? 'bg-blue-600 text-white rounded-br-sm' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                                }`}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                                
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
                                
                                {/* Show related journal entries for assistant messages */}
                                {message.role === "assistant" && message.relatedEntries && message.relatedEntries.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 font-medium flex items-center gap-1">
                                            📖 Related entries ({message.relatedEntries.length})
                                        </p>
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {message.relatedEntries.map((entry) => (
                                                <ChatJournalEntry key={entry.id} entry={entry} />
                                            ))}
                                        </div>
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
            <div className="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
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
                    />
                    <textarea
                        value={input}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={loading}
                        placeholder="Ask about your journal entries or share images/videos..."
                        className="flex-1 resize-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors min-h-[42px] max-h-24"
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
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center justify-center min-w-[60px] h-[42px]"
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