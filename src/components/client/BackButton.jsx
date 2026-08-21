import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Small back button placed at the top of every client step page so the user
// can always return to the previous step if they made a mistake.
export default function BackButton({ to, label = "Back" }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-lime-400/50 hover:text-lime-300"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> {label}
    </button>
  );
}