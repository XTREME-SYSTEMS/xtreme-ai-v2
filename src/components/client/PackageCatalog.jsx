import { useState } from "react";
import { Check, ArrowRight, Loader2, Sparkles, Bot, Monitor, Smartphone, Rocket, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { startCheckout } from "@/lib/checkout";

// Subscription / membership plans we sell.
const PLANS = [
  {
    name: "Free Starter", price: "$0", period: "forever", tagline: "Test the waters",
    features: ["1 AI Tool Access", "Basic Presence Audit", "Community Support", "Starter Dashboard"],
    cta: "Start Free", free: true, to: "/client-portal",
  },
  {
    name: "Pro", price: "$499", period: "/mo", tagline: "For growing businesses",
    features: ["5 AI Tools", "1 Custom Website", "SEO Basics", "Email Support", "Brand Pack (3 options)", "Client Dashboard"],
    cta: "Choose Pro", productId: "pro-monthly", highlight: false,
  },
  {
    name: "Elite", price: "$1499", period: "/mo", tagline: "Done-for-you growth",
    features: ["Unlimited AI Tools", "5 Custom Websites", "Full SEO + AEO", "Done-For-You Service", "Priority Support", "Brand Pack (10 + 2 iterations)", "Approval-Gated Workflow", "SMS + Email Notifications"],
    cta: "Choose Elite", productId: "elite-monthly", highlight: true,
  },
  {
    name: "Enterprise", price: "Custom", period: "", tagline: "Full operating system",
    features: ["Everything in Elite", "Dedicated Growth Team", "Custom AI Development", "SLA Guarantee", "Unlimited Websites", "White-Label Dashboard", "Quarterly Strategy Reviews"],
    cta: "Contact Sales", contact: true, to: "/#contact",
  },
];

// À-la-carte tools & packs we sell.
const ADDONS = [
  { name: "AI Tools", desc: "Individual AI chatbots, calculators, estimators & lead tools.", price: "From $99", productId: "ai-tool", icon: Bot },
  { name: "Web Packs", desc: "Complete website packages — design, build, SEO & launch.", price: "From $299", productId: "web-pack", icon: Monitor },
  { name: "App Packs", desc: "Custom web apps, client portals & internal tools.", price: "From $499", productId: "app-pack", icon: Smartphone },
];

// Done-for-you services.
const SERVICES = [
  { name: "Done-For-You Build", desc: "Your team handles the entire build — you guide & approve.", price: "Starts with deposit", productId: "deposit", icon: Rocket },
  { name: "Custom Proposal", desc: "A tailored plan prepared by your team before any work starts.", price: "Quote", icon: FileText },
];

function BuyButton({ item, variant = "primary" }) {
  const [loading, setLoading] = useState(false);
  const buy = async () => {
    setLoading(true);
    try { await startCheckout(item.productId); } catch (e) { alert(e.message || "Checkout failed."); }
    setLoading(false);
  };
  const base = "mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold transition-all disabled:opacity-50";
  const styles = variant === "highlight"
    ? "bg-lime-400 text-black hover:bg-lime-300"
    : "border border-black/20 text-black hover:bg-black hover:text-white";
  if (item.free || item.to) {
    return (
      <Link to={item.to} className={`${base} ${styles}`}>
        {item.cta} <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }
  return (
    <button onClick={buy} disabled={loading} className={`${base} ${styles}`}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{item.cta} <ArrowRight className="h-4 w-4" /></>}
    </button>
  );
}

export default function PackageCatalog() {
  return (
    <div className="space-y-10">
      {/* Plans */}
      <section>
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-700">
            <Sparkles className="h-3.5 w-3.5" /> Membership Plans
          </div>
          <h2 className="mt-2 text-lg font-semibold text-black">Plans we sell</h2>
          <p className="text-sm text-black/60">Recurring memberships — monthly or annual.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-4">
          {PLANS.map((t) => (
            <div key={t.name} className={`relative flex flex-col rounded-2xl border p-6 ${t.highlight ? "border-lime-400 bg-lime-400/5 shadow-lg shadow-lime-400/20" : "border-black/10 bg-white"}`}>
              {t.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-lime-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black">Most Popular</div>}
              <h3 className="text-lg font-bold text-black">{t.name}</h3>
              <p className="mt-1 text-xs text-black/50">{t.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-black">{t.price}</span>
                {t.period && <span className="text-sm text-black/50">{t.period}</span>}
              </div>
              <BuyButton item={t} variant={t.highlight ? "highlight" : "primary"} />
              <ul className="mt-6 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-black/70">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${t.highlight ? "text-lime-600" : "text-black/40"}`} /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* À-la-carte tools & packs */}
      <section>
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-700">
            <Bot className="h-3.5 w-3.5" /> Tools & Packs
          </div>
          <h2 className="mt-2 text-lg font-semibold text-black">À-la-carte tools we sell</h2>
          <p className="text-sm text-black/60">Buy individual tools, websites, or apps — pay online, get instant access.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {ADDONS.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.name} className="flex flex-col rounded-2xl border border-black/10 bg-white p-7 transition-all hover:border-black hover:shadow-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/10 text-lime-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-black">{a.name}</h3>
                <p className="mt-2 text-sm text-black/60">{a.desc}</p>
                <div className="mt-4 text-2xl font-black text-black">{a.price}</div>
                <ul className="mt-4 space-y-2 text-sm text-black/70">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-lime-600" /> Pay online (Stripe / Wix)</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-lime-600" /> Instant dashboard access</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-lime-600" /> Approval-gated delivery</li>
                </ul>
                <BuyButton item={a} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Done-for-you services */}
      <section>
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-700">
            <Rocket className="h-3.5 w-3.5" /> Done-For-You Services
          </div>
          <h2 className="mt-2 text-lg font-semibold text-black">Services we sell</h2>
          <p className="text-sm text-black/60">Your team handles the work — you guide and approve.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.name} className="flex flex-col rounded-2xl border border-black/10 bg-white p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/10 text-lime-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-black">{s.name}</h3>
                <p className="mt-2 text-sm text-black/60">{s.desc}</p>
                <div className="mt-4 text-lg font-bold text-black">{s.price}</div>
                {s.productId ? <BuyButton item={{ ...s, cta: "Start with Deposit" }} /> : (
                  <Link to="/#contact" className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-black/20 px-4 py-3 text-sm font-bold text-black transition-all hover:bg-black hover:text-white">
                    Contact Sales <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}