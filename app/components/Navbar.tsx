"use client";

import { format } from "date-fns";

interface NavbarProps {
  title?: string;
  subtitle?: string;
  onSignOut: () => void;
}

export default function Navbar({ 
  title = "My Journal",
  subtitle,
  onSignOut,
}: NavbarProps) {
  const defaultSubtitle = format(new Date(), "EEEE, MMMM do, yyyy");

  return (
    <header className="sticky top-0 z-40 backdrop-blur-sm bg-khaki-50/70 dark:bg-smoky-black-500/70 border-b border-[hsl(var(--primary)/0.3)]">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[hsl(var(--primary))]">
              {title}
            </h1>
            <p className="text-sm text-[hsl(var(--primary))]/80 font-serif mt-1">
              {subtitle || defaultSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onSignOut}
              className="px-3 py-2 rounded-lg text-sm text-smoky-black-700 dark:text-khaki-200 hover:bg-[hsl(var(--primary)/0.1)] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}