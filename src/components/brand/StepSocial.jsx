import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, ArrowLeft, Sparkles, RefreshCw, Instagram, Facebook, Linkedin } from "lucide-react";
import { buildSocialPrompt, buildSocialCaptionPrompt, socialCaptionSchema } from "@/lib/brandPrompts";

const PLATFORMS = [
  { key: "Instagram", icon: Instagram },
  { key: "Facebook", icon: Facebook },
  { key: "LinkedIn", icon: Linkedin },
];

export default function StepSocial({ project, persist, goNext, goBack }) {
  const [posts, setPosts] = useState(project?.social_posts || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true); setError("");
    try {
      const results = await Promise.all(PLATFORMS.map(async (p) => {
        const [img, cap] = await Promise.all([
          base44.integrations.Core.GenerateImage({ prompt: buildSocialPrompt(project, p.key) }),
          base44.integrations.Core.InvokeLLM({ prompt: buildSocialCaptionPrompt(project, p.key), response_json_schema: socialCaptionSchema() }),
        ]);
        return { platform: p.key, image_url: img.url, caption: cap.caption, hashtags: cap.hashtags || [], prompt: buildSocialPrompt(project, p.key) };
      }));
      setPosts(results);
      await persist({ social_posts: results, current_step: "video" });
    } catch (e) { setError(e.message || "Social post generation failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Social Media Posts</h2>
          <p className="text-xs text-white/40">AI-generated post + caption for each platform</p>
        </div>
        <Button onClick={generate} disabled={loading} className="bg-lime-400 text-black hover:bg-lime-300">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : posts.length ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {posts.length ? "Regenerate" : "Generate Posts"}
        </Button>
      </div>

      {error && <div className="mb-3 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-300">{error}</div>}

      {loading && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="aspect-square animate-pulse rounded-lg bg-zinc-800" />)}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-white/40">
          Click <span className="text-lime-400">Generate Posts</span> to create your social pack.
        </div>
      )}

      {posts.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {posts.map((post) => {
            const Icon = PLATFORMS.find((p) => p.key === post.platform)?.icon || Instagram;
            return (
              <div key={post.platform} className="overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
                <Image src={post.image_url} alt={post.platform} fittingType="fill" className="aspect-square w-full" />
                <div className="p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-white"><Icon className="h-3.5 w-3.5 text-lime-400" /> {post.platform}</div>
                  <p className="text-xs text-white/70">{post.caption}</p>
                  <p className="mt-1 text-[10px] text-lime-400/70">{(post.hashtags || []).map((h) => `#${h}`).join(" ")}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <Button variant="ghost" onClick={goBack} className="text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Button onClick={goNext} disabled={posts.length === 0} className="bg-lime-400 text-black hover:bg-lime-300">Continue to Video <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}