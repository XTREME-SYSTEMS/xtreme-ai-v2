import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Panel, EmptyState } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import ScoreBar from "@/components/ScoreBar";
import { Loader2, ShieldCheck } from "lucide-react";

// QA tab: loads BuildProjects for this prospect, then their ValidationRuns.
export default function QATab({ businessId }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const builds = await base44.entities.BuildProject.filter({ business_id: businessId }, "-created_date", 10);
        const allRuns = [];
        for (const b of builds) {
          const r = await base44.entities.ValidationRun.filter({ build_id: b.id }, "-created_date", 5);
          allRuns.push(...r);
        }
        setRuns(allRuns);
      } catch (e) {}
      setLoading(false);
    })();
  }, [businessId]);

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-white/50"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;

  if (runs.length === 0) return <EmptyState icon={ShieldCheck} title="No validation runs yet" subtitle="Run the Build flow → Run Validation Mesh to generate QA scores." />;

  return (
    <div className="space-y-3">
      {runs.map((v) => (
        <Panel key={v.id} title={`Validation Run · ${Math.round(v.total_score || 0)}/100`}>
          <div className="flex items-center gap-2">
            <StatusBadge status={v.pass ? "validated" : "failed"} />
            <span className="text-xs text-white/40">{new Date(v.created_date).toLocaleString()}</span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[["visual","Visual"],["mobile","Mobile"],["conversion","Conversion"],["lead_tool","Lead Tool"],["seo","SEO"],["aeo","AEO"],["trust","Trust"],["performance","Perf"],["accessibility","A11y"],["brand","Brand"]].map(([k,l]) => (
              <ScoreBar key={k} label={l} value={v[`${k}_score`]} />
            ))}
          </div>
          {v.failures?.length > 0 && (
            <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5">
              <div className="text-xs font-semibold text-rose-300">Failures</div>
              <ul className="mt-1 space-y-0.5">{v.failures.map((f,i)=><li key={i} className="text-xs text-rose-200">• {f}</li>)}</ul>
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}