import { createContext, useContext, useCallback } from "react";

// Xtreme AI secluded-portal context.
// Provides `xp(path)` so navigation inside the /xtreme section stays within
// the /xtreme prefix. Pages opt in via useXtreme(); until they do, they
// navigate with bare paths (legacy behavior). This lets us migrate pages
// incrementally without breaking the existing client portal.
const XtremeContext = createContext(null);

export function XtremeProvider({ children }) {
  const xp = useCallback((path) => {
    if (!path) return "/xtreme";
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `/xtreme${clean}`;
  }, []);
  return (
    <XtremeContext.Provider value={{ isXtreme: true, prefix: "/xtreme", xp }}>
      {children}
    </XtremeContext.Provider>
  );
}

export function useXtreme() {
  const ctx = useContext(XtremeContext);
  return ctx || { isXtreme: false, prefix: "", xp: (p) => p };
}