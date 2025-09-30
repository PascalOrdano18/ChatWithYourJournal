"use client";

import { ReactNode, useEffect } from "react";
import { ThemeContext, useThemeLogic } from "@/hooks/useTheme";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, toggleTheme, mounted } = useThemeLogic();

  // Agrega una flag class una vez que el tema se resuelve para habilitar las transiciones de CSS de forma segura
  useEffect(() => {
    if (mounted && typeof document !== "undefined") {
      document.documentElement.classList.add("theme-ready");
    }
  }, [mounted]);

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