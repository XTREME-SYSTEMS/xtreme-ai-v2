import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Fetches the backend signals that complete the two non-gate pipeline steps
// (index-rank, optimize) for a given user email. Returns { signals, loading }.
export function usePipelineSignals(email) {
  const [signals, setSignals] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("getPipelineSignals", { email });
        if (!cancelled) setSignals(res.data || {});
      } catch (e) {
        if (!cancelled) setSignals({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [email]);

  return { signals, loading };
}