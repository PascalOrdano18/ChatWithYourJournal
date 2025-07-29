"use client";

import { ReactNode } from "react";
import { ThemeContext, useThemeLogic } from "@/hooks/useTheme";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, toggleTheme, mounted } = useThemeLogic();

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {!mounted ? (
        <div style={{ visibility: "hidden" }}>{children}</div>
      ) : (
        children
      )}
    </ThemeContext.Provider>
  );
} 