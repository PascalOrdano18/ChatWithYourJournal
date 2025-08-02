
"use client";

import { useState } from "react";

type Message = {
    role: "user" | "assistant",
    content: string,
};

export default function ChatWithJournal(){
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);


    const handleChange = (value: string):void => {
        setInput(value);
    }

    async function handleSubmit(){
        if(!input.trim()) return ;
        
        const userMessage: Message = { role: "user", content: input };
        setMessages(prevMsg => [...prevMsg, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: input }),
            })

            const data = await res.json();


            const aiMessage: Message = { role: "assistant", content: data.answer };
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
                            <p className="text-sm font-serif">Ask questions about your entries</p>
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
                <div className="flex items-end space-x-3 max-w-full">
                    <textarea
                        value={input}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={loading}
                        placeholder="Ask about your journal entries..."
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
                                if (!loading && input.trim()) {
                                    handleSubmit();
                                }
                            }
                        }}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !input.trim()}
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