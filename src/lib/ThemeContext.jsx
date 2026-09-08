import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext(null);

function getSystem() {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  // System is permanently locked to light mode — white background, black text.
  const resolved = "light";

  // Always force light mode on <html>, never apply .dark.
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    if (typeof window !== "undefined") localStorage.setItem("theme", "light");
  }, []);

  // setTheme and toggle are no-ops — system stays light.
  const setTheme = useCallback(() => {}, []);
  const toggle = useCallback(() => {}, []);

  return (
    <ThemeContext.Provider value={{ theme: "light", resolved: "light", setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "light", resolved: "light", setTheme: () => {}, toggle: () => {} };
  return ctx;
}