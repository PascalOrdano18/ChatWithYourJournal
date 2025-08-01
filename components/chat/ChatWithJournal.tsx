
"use client";

type Message = {
    role: "user" | "assistant",
    content: string,
};

export default function ChatWithJournal(){
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="text-center text-gray-500 dark:text-gray-400">
                <h3 className="text-lg font-medium mb-2">Chat with your Journal</h3>
                <p className="text-sm">Coming soon - AI-powered conversations with your journal entries</p>
            </div>
        </div>
    );
}