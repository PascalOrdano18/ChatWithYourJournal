"use client";

import { format } from "date-fns";
import { Moon, Sun } from "lucide-react";
import Link from "next/link";

interface NavbarProps {
  title?: string;
  subtitle?: string;
  onSignOut: () => void;
  onToggleTheme: () => void;
  theme: "light" | "dark";
}

export default function Navbar({ 
  title = "My Journal",
  subtitle,
  onSignOut,
  onToggleTheme,
  theme
}: NavbarProps) {
  const defaultSubtitle = format(new Date(), "EEEE, MMMM do, yyyy");

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-6 md:px-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white tracking-wide">
            {title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 font-serif italic mt-1">
            {subtitle || defaultSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href='/journal'
            prefetch={true}
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium underline decoration-2 underline-offset-4 hover:decoration-gray-900 dark:hover:decoration-white"
          >
            📔 Journal
          </Link>
          <Link 
            href='/journal/chat'
            prefetch={true}
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium underline decoration-2 underline-offset-4 hover:decoration-gray-900 dark:hover:decoration-white"
          >
            💬 Chat
          </Link>
          <button
            onClick={onSignOut}
            className="text-sm text-gray-600 dark:text-gray-400 underline hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium"
          >
            Sign Out
          </button>
          <button
            onClick={onToggleTheme}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-200 dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
          >
            {theme === "light" ? (
              <>
                <Moon className="h-4 w-4" />
                Dark Mode
              </>
            ) : (
              <>
                <Sun className="h-4 w-4" />
                Light Mode
              </>
            )}
          </button>
          {/* Debug indicator */}
          <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
            {theme}
          </div>
        </div>
      </div>
    </header>
  );
}