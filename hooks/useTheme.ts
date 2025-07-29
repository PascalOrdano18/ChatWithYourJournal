"use client";

import { useState, useEffect, createContext, useContext } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function useThemeLogic() {
  const [theme, setTheme] = useState<Theme>("light"); // Default to light
  const [mounted, setMounted] = useState(false);

  // Apply theme immediately when theme state changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    setMounted(true);
    
    // Check localStorage and system preference after mounting
    const stored = localStorage.getItem("journal-theme") as Theme;
    if (stored && (stored === "light" || stored === "dark")) {
      if (stored !== theme) {
        setTheme(stored);
      }
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const systemTheme = prefersDark ? "dark" : "light";
      if (systemTheme !== theme) {
        setTheme(systemTheme);
      }
    }
  }, [theme]);

  const applyTheme = (newTheme: Theme) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (newTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("journal-theme", newTheme);
    }
  };

  return { theme, toggleTheme, mounted };
}

export { ThemeContext }; 