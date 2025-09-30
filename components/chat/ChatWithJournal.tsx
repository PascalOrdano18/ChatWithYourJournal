
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';



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
                    unoptimized={true}
                    onError={(e) => {
                        console.log('Attachment image failed to load:', attachment.url);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'w-20 h-20 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600';
                        errorDiv.innerHTML = '<div class="text-xs text-gray-500 dark:text-gray-400 text-center">⚠️</div>';
                        target.parentNode?.appendChild(errorDiv);
                    }}
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
                                    unoptimized={true} // Always disable optimization for external URLs
                                    onError={(e) => {
                                        console.log('Image failed to load:', url);
                                        // Show error message instead of hiding
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const errorDiv = document.createElement('div');
                                        errorDiv.className = 'max-w-full max-h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4';
                                        errorDiv.innerHTML = `
                                            <div class="text-center text-gray-500 dark:text-gray-400">
                                                <div class="text-sm">⚠️ Imagen no disponible</div>
                                                <div class="text-xs mt-1">${url}</div>
                                            </div>
                                        `;
                                        target.parentNode?.appendChild(errorDiv);
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
    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
          api: '/api/ask',
        }),
      });
    
    const [input, setInput] = useState<string>('');


    
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
                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]"></div>
                        <Link href="/journal/chat" className="text-sm font-serif font-semibold text-gray-900 dark:text-white hover:underline">
                            {title || 'Chat'}
                        </Link>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-md transition-colors focus:outline-none ${frameless ? 'hover:bg-white/20 text-white' : 'hover:bg-white/50 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200'}`}
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
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
                            <p className={`${compact ? 'text-xs' : 'text-sm'} font-serif text-white`}>Ask questions about your entries or share images/videos</p>
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
                                        ? 'bg-[hsl(var(--primary))] text-white rounded-br-sm shadow-sm' 
                                        : 'bg-white/70 dark:bg-gray-700/70 backdrop-blur border border-gray-200/60 dark:border-gray-600/60 text-gray-900 dark:text-white rounded-bl-sm shadow-sm'
                                }`}
                            >

                                {message.parts.map((part, idx) => (
            
                                    part.type === 'text' ? (
                                        message.role === 'assistant' ? (
                                            <MarkdownContent key={idx} content={part.text} />
                                        ) : (
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{part.text}</p>
                                        )
                                    ) : (
                                        ""
                                    )
                                ))}
                                
                            </div>
                        </div>
                    ))}
                    
                    {status === 'submitted' && (
                        <div className="flex justify-start pr-12">
                            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                                <div className="flex items-center space-x-2">
                                    <div className="flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                        <div className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                        <div className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                    </div>
                                    <span className="text-sm text-white">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Input Container */}
            <div className={`border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 ${compact ? 'px-4 py-3' : 'px-6 py-4'}`}>
                
                
                <form 
                    onSubmit={e => {
                        e.preventDefault();
                        if (input.trim()) {
                        sendMessage({ text: input });
                        setInput('');
                        }
                    }} 
                    className="flex items-end space-x-3 max-w-full">
                    
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={status !== 'ready'}
                        placeholder={compact ? 'Message...' : 'Ask about your journal entries or share images/videos...'}
                        className={`flex-1 resize-none rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-white dark:placeholder-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors min-h-[38px] max-h-24 ${compact ? 'bg-white dark:bg-gray-700 border border-[hsl(var(--primary))]' : 'bg-white dark:bg-gray-800 border border-[hsl(var(--primary))]'}`}
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (status === 'ready' && input.trim()) {
                                    sendMessage({text: input});
                                    setInput('');
                                }
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={status !== 'ready' || !input.trim()}
                        className={`text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] ${compact ? 'bg-[hsl(var(--primary))] hover:brightness-110 disabled:bg-gray-300/70 dark:disabled:bg-gray-600/70 focus:ring-offset-0' : 'bg-[hsl(var(--primary))] hover:brightness-110 disabled:bg-gray-300 dark:disabled:bg-gray-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800'} disabled:cursor-not-allowed flex items-center justify-center min-w-[52px] h-[38px] shadow-sm`}
                    >
                        {status !== 'ready' ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}