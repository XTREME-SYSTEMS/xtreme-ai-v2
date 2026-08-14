import { createContext, useContext, useEffect, useState } from "react";

const PreviewContext = createContext({ previewAsClient: false, setPreview: () => {}, togglePreview: () => {} });
const KEY = "lgny_preview_client";

export function PreviewProvider({ children }) {
  const [previewAsClient, setPreview] = useState(() => {
    try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, previewAsClient ? "1" : "0"); } catch {}
  }, [previewAsClient]);

  const togglePreview = () => setPreview((v) => !v);

  return (
    <PreviewContext.Provider value={{ previewAsClient, setPreview, togglePreview }}>
      {children}
    </PreviewContext.Provider>
  );
}

export const usePreview = () => useContext(PreviewContext);