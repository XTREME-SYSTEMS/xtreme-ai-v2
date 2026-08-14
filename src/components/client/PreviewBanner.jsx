import { usePreview } from "@/lib/PreviewContext";
import { Eye, X } from "lucide-react";

// Banner shown across client pages when an admin is previewing the portal.
// If a specific client was chosen, data is scoped to them; otherwise a
// warning is shown that the admin is seeing admin-scoped data.
export default function PreviewBanner() {
  const { previewAsClient, previewClientEmail, clearPreview } = usePreview();
  if (!previewAsClient) return null;
  return (
    <div className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
      previewClientEmail
        ? "border-lime-400/40 bg-lime-400/10 text-lime-300"
        : "border-amber-400/40 bg-amber-400/10 text-amber-300"
    }`}>
      <Eye className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1">
        {previewClientEmail
          ? `Previewing as ${previewClientEmail} — data is scoped to this client`
          : "Preview as client — no client selected, showing admin-scoped data"}
      </span>
      <button onClick={clearPreview} className="flex items-center gap-1 rounded-md border border-current/30 px-2 py-1 text-[10px] font-semibold uppercase hover:bg-current/10">
        <X className="h-3 w-3" /> Exit
      </button>
    </div>
  );
}