
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="text-center text-gray-500 dark:text-gray-400 flex flex-col items-end">
                {messages.map((message, id) => (
                    <div 
                        key={id}
                        className={`w-full ${message.role === "user" ? 'bg-blue-400 text-black' : 'bg-blue-950 text-white'}`}
                        >
                        <p className="mx-2 my-5">{message.content}</p>
                    </div>
                ))}
                {loading && <p>Bancala que piensa el tipo</p>}
                <textarea
                    className="text-black w-3/4 mx-auto h-full rounded-sm p-4"
                    onChange={(e) => handleChange(e.target.value)}
                    disabled={loading}
                />
                <button
                    className="bg-blue-500 m-10 p-2 rounded-lg w-fit text-black hover:cursor-pointer hover:bg-blue-600 transition-all"
                    onClick={handleSubmit}
                    disabled={loading}
                    >
                    Submit
                </button>
            </div>
        </div>
    );
}