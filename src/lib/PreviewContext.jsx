import { createContext, useContext, useEffect, useState } from "react";

const PreviewContext = createContext({
  previewAsClient: false,
  previewClientEmail: null,
  setPreview: () => {},
  setPreviewClient: () => {},
  togglePreview: () => {},
  clearPreview: () => {},
});
const KEY = "lgny_preview_client";
const EMAIL_KEY = "lgny_preview_client_email";

export function PreviewProvider({ children }) {
  const [previewAsClient, setPreview] = useState(() => {
    try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
  });
  const [previewClientEmail, setPreviewClientEmail] = useState(() => {
    try { return localStorage.getItem(EMAIL_KEY) || null; } catch { return null; }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, previewAsClient ? "1" : "0"); } catch {}
  }, [previewAsClient]);

  useEffect(() => {
    try {
      if (previewClientEmail) localStorage.setItem(EMAIL_KEY, previewClientEmail);
      else localStorage.removeItem(EMAIL_KEY);
    } catch {}
  }, [previewClientEmail]);

  const togglePreview = () => setPreview((v) => !v);
  const setPreviewClient = (email) => { setPreviewClientEmail(email); setPreview(true); };
  const clearPreview = () => { setPreview(false); setPreviewClientEmail(null); };

  return (
    <PreviewContext.Provider value={{ previewAsClient, previewClientEmail, setPreview, setPreviewClient, togglePreview, clearPreview }}>
      {children}
    </PreviewContext.Provider>
  );
}

export const usePreview = () => useContext(PreviewContext);