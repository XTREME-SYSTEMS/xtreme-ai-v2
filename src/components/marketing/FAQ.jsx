import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

// Content is rendered openly (not collapsed) so search engines and AI answer
// engines can crawl and cite every Q&A — this is intentional for AEO.
const FAQS = [
  {
    q: "What is lead generation and how does Lead Generation Near You do it differently?",
    a: "Lead generation is the process of attracting and converting strangers into potential customers for your business. Lead Generation Near You runs lead generation as an AI-powered operating system — not a one-off campaign. We combine AI services, website creation, SEO, AEO (Answer Engine Optimization), and full-stack marketing into one approval-gated system engineered to deliver real, qualified leads instead of vanity metrics.",
  },
  {
    q: "What is AEO (Answer Engine Optimization) and why does it matter for my business?",
    a: "AEO, or Answer Engine Optimization, is the practice of optimizing your business to be cited by AI search engines and answer engines like Google AI Overviews, ChatGPT, Perplexity, and voice assistants. As more people ask AI systems questions instead of clicking blue links, AEO ensures your business is the answer those engines quote. We build structured data, FAQ content, and authoritative topical pages so AI systems surface your business first.",
  },
  {
    q: "How fast can I get on the first page of Google and AI search engines?",
    a: "Speed depends on your industry, location, and competition. Local SEO and AEO can produce first-page visibility in weeks for lower-competition niches, while competitive national keywords take months. Our system prioritizes the fastest paths first — local SEO, Google Business Profile optimization, answer-engine-friendly content, and high-intent landing pages — so you see movement as quickly as technologically possible.",
  },
  {
    q: "What is the difference between SEO and AEO?",
    a: "SEO (Search Engine Optimization) targets traditional search engine rankings on Google, Bing, and other search engines. AEO (Answer Engine Optimization) targets AI-powered answer engines and voice assistants that synthesize answers from multiple sources. SEO gets you ranked; AEO gets you quoted. Lead Generation Near You does both, so your business shows up in classic search results and in AI-generated answers.",
  },
  {
    q: "How much do lead generation services cost?",
    a: "Pricing starts at $0 with our Free Starter tier. Pro is $499/month, Elite (done-for-you growth) is $1,499/month, and Enterprise is custom-quoted. You can also buy individual AI tools from $99, web packs from $2,500, and app packs from $5,000. Done-for-you services start with a deposit and include an approval-gated client dashboard.",
  },
  {
    q: "Do you offer lead generation services near me?",
    a: "Yes. We are based in Pompano Beach, Florida and serve local businesses across South Florida — including Fort Lauderdale, Miami, Boca Raton, West Palm Beach, Deerfield Beach, Coral Springs, and Hollywood FL — plus clients nationwide. Because our system is AI-powered and dashboard-driven, we can run lead generation for your business anywhere in the United States.",
  },
  {
    q: "What industries do you serve for lead generation?",
    a: "We generate leads for HVAC, roofing, plumbing, dental, legal, real estate, med spa, landscaping, auto repair, home services, general contractors, restaurants, fitness, medical, insurance, financial services, e-commerce, and SaaS companies. Our Industry DNA engine maps the winning intents, tools, and tactics for each vertical, so your lead generation strategy is tuned to your specific industry.",
  },
  {
    q: "How does the approval-gated process work?",
    a: "Every deliverable — brand packs, websites, content, and campaigns — flows through an approval-gated client dashboard. You pay your deposit, create your account, and review each step before it goes live. You get real-time notifications by email and SMS, and nothing ships without your sign-off. It is transparent, collaborative, and built for your highest customer experience.",
  },
  {
    q: "What AI tools do you offer for lead generation?",
    a: "Our AI Tools marketplace includes an AI Lead Chatbot, AI Quote Estimator, AI SEO Auditor, AI Content Generator, AI Call Scheduler, and AI Brand Designer. Each tool is built to capture, qualify, or convert leads. Buy any tool online and get instant dashboard access — no retainer required.",
  },
  {
    q: "How do I get started with Lead Generation Near You?",
    a: "Book a free 15-minute strategy call or choose a plan on our pricing page. Pay your deposit online, create your account, and get instant access to your approval-gated client dashboard. From there you will receive an onboarding email and SMS, a brand pack with 10 options, and a full growth roadmap built around your business.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="bg-zinc-50 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-600"><HelpCircle className="h-3.5 w-3.5" /> FAQ</div>
          <h2 className="text-3xl font-black tracking-tight text-black sm:text-5xl">Questions, Answered.</h2>
          <p className="mt-4 text-lg text-black/60">Everything you need to know about lead generation, AI services, SEO, AEO, and how our growth operating system works.</p>
        </motion.div>
        <div className="mt-12 space-y-4">
          {FAQS.map((f, i) => (
            <motion.div key={f.q} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-black/10 bg-white p-6">
              <h3 className="text-base font-bold text-black sm:text-lg">{f.q}</h3>
              <p className="mt-2 text-sm text-black/60 sm:text-base">{f.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}