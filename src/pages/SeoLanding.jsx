import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import ReactMarkdown from "react-markdown";

export default function SeoLanding() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await base44.entities.SeoPage.filter({ slug, status: "published" }, "-created_date", 1);
        if (mounted) setPage(res[0] || null);
      } catch {
        if (mounted) setPage(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  // Per-page head injection for SEO/AEO (title, meta description, robots, JSON-LD)
  useEffect(() => {
    if (!page) return;
    const prevTitle = document.title;
    document.title = page.title || page.h1 || page.target_keyword;
    const setMeta = (name, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", page.meta_description);
    setMeta("robots", "index, follow");
    let ldEl = document.getElementById("seo-page-jsonld");
    if (ldEl) ldEl.remove();
    if (page.json_ld) {
      ldEl = document.createElement("script");
      ldEl.id = "seo-page-jsonld";
      ldEl.type = "application/ld+json";
      ldEl.textContent = page.json_ld;
      document.head.appendChild(ldEl);
    }
    return () => {
      document.title = prevTitle;
      const e = document.getElementById("seo-page-jsonld");
      if (e) e.remove();
    };
  }, [page]);

  if (loading) return <div className="min-h-screen bg-white" />;

  if (!page) {
    return (
      <div className="min-h-screen bg-white">
        <MarketingNav />
        <div className="mx-auto max-w-3xl px-6 py-32 text-center">
          <h1 className="text-3xl font-bold text-black">Page not found</h1>
          <Link to="/" className="mt-6 inline-flex font-semibold text-lime-600">← Back home</Link>
        </div>
        <MarketingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <MarketingNav />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-semibold text-lime-700">
          <MapPin className="h-3.5 w-3.5" /> {page.city}, {page.state}
        </div>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{page.h1}</h1>
        <p className="mt-5 text-lg text-zinc-700">{page.intro}</p>

        <div className="mt-8 rounded-2xl bg-lime-400 p-6 text-black">
          <p className="font-bold">Want leads — not vanity metrics?</p>
          <p className="mt-1 text-sm">We throw the book at your growth: AI services, websites, SEO, AEO, and marketing in one approval-gated operating system.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/pricing" className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-zinc-800">See pricing <ArrowRight className="h-4 w-4" /></Link>
            <a href="/#contact" className="inline-flex items-center gap-2 rounded-lg border-2 border-black px-5 py-2.5 text-sm font-bold hover:bg-black hover:text-white"><Phone className="h-4 w-4" /> Book a call</a>
          </div>
        </div>

        {(page.sections || []).map((s, i) => (
          <section key={i} className="mt-10">
            <h2 className="text-2xl font-bold tracking-tight">{s.heading}</h2>
            <div className="mt-3 text-zinc-700 leading-relaxed [&_h3]:mt-4 [&_h3]:font-semibold [&_h3]:text-black [&_p]:mb-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_a]:text-lime-700 [&_a]:underline">
              <ReactMarkdown>{s.body || ""}</ReactMarkdown>
            </div>
          </section>
        ))}

        {page.faq && page.faq.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <div className="mt-4 space-y-5">
              {page.faq.map((f, i) => (
                <div key={i}>
                  <h3 className="font-semibold text-black">{f.question}</h3>
                  <p className="mt-1 text-zinc-700">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Ready to dominate {page.city}?</h2>
          <p className="mx-auto mt-2 max-w-xl text-zinc-600">Let our AI growth operating system research your market, audit your presence, and build the assets that win the front page.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/pricing" className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-6 py-3 text-sm font-bold text-black hover:bg-lime-300">Get started <ArrowRight className="h-4 w-4" /></Link>
            <a href="/#contact" className="inline-flex items-center gap-2 rounded-lg border-2 border-black px-6 py-3 text-sm font-bold hover:bg-black hover:text-white"><Phone className="h-4 w-4" /> Book a 15-min call</a>
          </div>
        </section>
      </article>
      <MarketingFooter />
    </div>
  );
}