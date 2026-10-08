import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext(null);

function getInitial() {
  if (typeof window === "undefined") return "dark";
  // Version key — old code forced "light" into localStorage; bumping this
  // version ignores that stale value and defaults to dark.
  const VERSION = "v2-dark";
  const savedVersion = localStorage.getItem("theme_version");
  const saved = localStorage.getItem("theme");
  if (savedVersion !== VERSION) {
    localStorage.setItem("theme_version", VERSION);
    localStorage.setItem("theme", "dark");
    return "dark";
  }
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitial);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const setTheme = useCallback((t) => {
    setThemeState(t === "dark" ? "dark" : "light");
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved: theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "dark", resolved: "dark", setTheme: () => {}, toggle: () => {} };
  return ctx;
}