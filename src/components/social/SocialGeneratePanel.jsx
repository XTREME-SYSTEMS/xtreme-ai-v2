import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientUpdate } from "@/hooks/useClientUpdate";

// Generates (or regenerates) the social media pack: 10 brand templates + a
// 30-day content calendar. Saves the result to the client's profile so the
// Media Library and Content Calendar tabs pick it up.
export default function SocialGeneratePanel({ onGenerated }) {
  const { user } = useClientUser();
  const { update } = useClientUpdate();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const profile = user?.epoxyProfile || {};

  const generate = async () => {
    if (!profile?.businessName) { setError("Complete your Business Profile first so we can generate on-brand content."); return; }
    setGenerating(true); setError("");
    try {
      const res = await base44.functions.invoke("generateSocialMediaPack", {
        businessName: profile.businessName,
        primaryLocation: profile.primaryLocation,
        services: profile.services || [],
        logoUrl: user?.chosenLogoUrl || "",
        industry: profile.industry || "",
        subIndustry: profile.subIndustry || "",
        businessType: profile.businessType || "",
      });
      const d = res?.data?.data;
      if (!d?.templates?.length) throw new Error("no data");
      await update({ socialMediaPack: d });
      onGenerated?.(d);
    } catch (e) { setError("Couldn't generate the social media pack. Try again."); }
    finally { setGenerating(false); }
  };

  return (
    <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
        <Sparkles className="h-4 w-4" /> Generate Social Media Pack
      </div>
      <p className="mt-2 text-sm text-white/70">
        We'll design 10 on-brand social templates (profile, cover, stories, posts, icons) using your approved logo and build a full 30-day content calendar with captions and best posting times.
      </p>
      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}
      <button onClick={generate} disabled={generating}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50">
        {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><RefreshCw className="h-4 w-4" /> Generate / Regenerate Pack</>}
      </button>
      {generating && <p className="mt-2 text-xs text-white/40">About 60 seconds — designing templates and writing captions.</p>}
    </div>
  );
}