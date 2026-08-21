import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import WalkthroughViewer from "@/components/walkthrough/WalkthroughViewer";
import { Loader2, AlertCircle, Box } from "lucide-react";

// Public 3D walkthrough viewer page. Accessible via /walkthrough/:token
// without authentication — loads the walkthrough via getWalkthroughByToken.
export default function WalkthroughView() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No walkthrough token provided.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await base44.functions.invoke("getWalkthroughByToken", { shareToken: token });
        const d = res?.data || res;
        if (d?.ok) {
          setData(d);
        } else {
          setError(d?.error || "Walkthrough not found.");
        }
      } catch (e) {
        setError(e?.message || "Failed to load walkthrough.");
      }
      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
          <p className="text-sm text-white/50">Loading 3D walkthrough…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black p-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-400/10">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <h1 className="text-lg font-semibold text-white">Walkthrough Unavailable</h1>
          <p className="mt-2 text-sm text-white/50">{error}</p>
          <p className="mt-4 text-xs text-white/30">Please contact the person who shared this link with you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <WalkthroughViewer
        viewpoints={data.viewpoints}
        title={data.title}
        description={data.description}
        fullscreen
      />
    </div>
  );
}