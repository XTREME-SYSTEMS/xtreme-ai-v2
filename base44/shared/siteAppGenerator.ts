// siteAppGenerator — generates a full Vite + React + Tailwind web application
// from market + SEO data. Replaces the old static-HTML generator that produced
// pathetic 5-file sites. This produces a REAL system: React components, working
// lead capture API, Tailwind styling, proper SEO, and build configuration.

export function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function b64(s) {
  return btoa(unescape(encodeURIComponent(String(s))));
}

// Generate a complete Vite + React + Tailwind project from market + SEO data.
// Returns a { path: content } map ready to push to GitHub.
export function generateSiteApp(market, seo) {
  const domain = market.domain || `${market.slug || slugify(market.state + "-" + market.city)}.vercel.app`;
  const brand = market.public_business_name || market.brand_name || "Local Service Pro";
  const phone = market.phone || "(555) 123-4567";
  const email = market.email || `leads@${domain}`;
  const city = market.city || "National";
  const state = market.state || "US";
  const area = market.service_area_description || `${city}, ${state}`;
  const industry = market.industry || market.niche || "garage floor coating";
  const industryTitle = industry.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const metaTitle = seo?.meta_title || `${brand} | ${industryTitle} ${city}, ${state}`;
  const metaDesc = seo?.meta_description || `Professional ${industry} in ${city}, ${state}. Free estimates, expert installation, guaranteed results. Call ${phone}.`;
  const faq = seo?.faq || [
    { question: `How much does ${industry} cost in ${city}?`, answer: `Pricing depends on the size and condition of your space. We offer free, no-obligation estimates — call ${phone} today.` },
    { question: `How long does installation take?`, answer: `Most projects are completed in one day. We'll give you an exact timeline during your free estimate.` },
    { question: `Do you offer a warranty?`, answer: `Yes, all our work comes with a satisfaction guarantee and manufacturer warranty on materials.` },
    { question: `What areas do you serve?`, answer: `We serve ${area} and surrounding communities. Call to confirm your area.` },
  ];
  const services = seo?.services || [
    { title: "Full-Broadcast Flake Systems", description: "Decorative flake coatings that hide imperfections and resist stains — available in dozens of color blends." },
    { title: "Metallic Epoxy Floors", description: "High-gloss, three-dimensional metallic finishes for a premium, one-of-a-kind look." },
    { title: "Polyaspartic Coating", description: "Fast-curing, UV-stable coatings that can be walked on the same day — ideal for any climate." },
    { title: "Concrete Prep & Repair", description: "Professional grinding, crack filling, and surface prep for a flawless, long-lasting bond." },
  ];
  const jsonLd = seo?.json_ld?.localbusiness || {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: brand,
    telephone: phone,
    areaServed: `${city}, ${state}`,
    address: { "@type": "PostalAddress", addressLocality: city, addressRegion: state },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };

  const accentColor = "#D4FF4D";
  const darkColor = "#0a0a0a";

  // ---- package.json ----
  const packageJson = JSON.stringify({
    name: slugify(brand),
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
    },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
    },
    devDependencies: {
      "@vitejs/plugin-react": "^4.2.0",
      autoprefixer: "^10.4.16",
      postcss: "^8.4.32",
      tailwindcss: "^3.4.0",
      vite: "^5.0.0",
    },
  }, null, 2);

  // ---- vite.config.js ----
  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;

  // ---- tailwind.config.js ----
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: '${accentColor}',
        dark: '${darkColor}',
      },
    },
  },
  plugins: [],
}`;

  // ---- postcss.config.js ----
  const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

  // ---- index.html (Vite entry) ----
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${metaTitle}</title>
  <meta name="description" content="${metaDesc}" />
  <link rel="canonical" href="https://${domain}/" />
  <meta property="og:title" content="${seo?.og_title || metaTitle}" />
  <meta property="og:description" content="${seo?.og_description || metaDesc}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://${domain}/" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`;

  // ---- src/main.jsx ----
  const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

  // ---- src/index.css ----
  const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

html { scroll-behavior: smooth; }
body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }`;

  // ---- src/App.jsx ----
  const appJsx = generateAppJsx({ brand, phone, email, city, state, industry, industryTitle, services, faq, accentColor, darkColor, domain });

  // ---- api/lead.js (Vercel serverless function) ----
  const leadApi = `export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Parse the request body from the stream
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
    const { name, email, phone, message } = body;
    // Store the lead — in production this would write to a database
    console.log('New lead received:', { name, email, phone, message, timestamp: new Date().toISOString() });
    res.status(200).json({ ok: true, message: 'Thank you! We will contact you shortly.' });
  } catch (err) {
    console.error('Lead capture error:', err);
    res.status(500).json({ error: 'Something went wrong. Please call us instead.' });
  }
}`;

  // ---- vercel.json ----
  const vercelJson = JSON.stringify({
    rewrites: [
      { source: "/api/(.*)", destination: "/api/$1" },
    ],
  }, null, 2);

  // ---- public/robots.txt ----
  const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: https://${domain}/sitemap.xml`;

  // ---- public/sitemap.xml ----
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://${domain}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n  <url><loc>https://${domain}/#cost</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n  <url><loc>https://${domain}/#faq</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n</urlset>`;

  // ---- README.md ----
  const readme = `# ${brand}

A professional ${industry} lead-generation web app for ${city}, ${state}.

## Tech Stack
- **React 18** — UI framework
- **Vite 5** — build tool & dev server
- **Tailwind CSS 3** — styling
- **Vercel** — deployment & serverless functions

## Features
- SEO-optimized with JSON-LD structured data (LocalBusiness + FAQ)
- Responsive design (mobile + desktop)
- Lead capture form with serverless API endpoint
- Open Graph meta tags for social sharing
- Sitemap & robots.txt for search engines

## Live URL
https://${domain}

## Contact
- Phone: ${phone}
- Email: ${email}

## Development
\`\`\`bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview production build
\`\`\`

Auto-provisioned by the Lead Gen Near You site factory.
`;

  return {
    "package.json": packageJson,
    "vite.config.js": viteConfig,
    "tailwind.config.js": tailwindConfig,
    "postcss.config.js": postcssConfig,
    "index.html": indexHtml,
    "vercel.json": vercelJson,
    "src/main.jsx": mainJsx,
    "src/index.css": indexCss,
    "src/App.jsx": appJsx,
    "api/lead.js": leadApi,
    "public/robots.txt": robotsTxt,
    "public/sitemap.xml": sitemapXml,
    "README.md": readme,
  };
}

// Generate the main App.jsx with all section components
function generateAppJsx({ brand, phone, email, city, state, industry, industryTitle, services, faq, accentColor, darkColor, domain }) {
  return `import { useState } from 'react'

const PHONE = "${phone}"
const EMAIL = "${email}"
const BRAND = "${brand}"
const CITY = "${city}"
const STATE = "${state}"
const INDUSTRY = "${industry}"
const INDUSTRY_TITLE = "${industryTitle}"
const ACCENT = "${accentColor}"
const DARK = "${darkColor}"

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-dark text-white py-3 px-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <span className="text-lg font-bold">{BRAND}</span>
        <nav className="hidden sm:flex gap-5 text-sm">
          <a href="#services" className="hover:text-accent transition">Services</a>
          <a href="#how" className="hover:text-accent transition">How It Works</a>
          <a href="#cost" className="hover:text-accent transition">Cost</a>
          <a href="#faq" className="hover:text-accent transition">FAQ</a>
          <a href="#contact" className="hover:text-accent transition">Contact</a>
        </nav>
        <a href="tel:${phone.replace(/[^0-9+]/g, "")}" className="text-sm font-semibold text-accent">{PHONE}</a>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="bg-gradient-to-br from-dark to-zinc-800 text-white py-20 px-4 text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{INDUSTRY_TITLE} in {CITY}, {STATE}</h1>
        <p className="text-lg text-white/85 mb-6 max-w-xl mx-auto">
          Professional ${industry} built to last. Free estimates, expert installation, and a finish that transforms your space.
        </p>
        <a href="#contact" className="inline-block bg-accent text-black px-7 py-3.5 rounded-lg font-bold text-lg hover:opacity-90 transition">
          Get My Free Estimate
        </a>
        <p className="mt-4 text-sm text-white/70">Call {PHONE}</p>
      </div>
    </section>
  )
}

function Services() {
  const services = ${JSON.stringify(services, null, 2)}
  return (
    <section id="services" className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center text-dark">Our Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((s, i) => (
            <div key={i} className="border border-zinc-200 rounded-xl p-6 hover:shadow-lg transition">
              <h3 className="text-lg font-semibold mb-2 text-dark">{s.title}</h3>
              <p className="text-sm text-zinc-600">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { title: "Free Estimate", desc: "Share your project details and we'll provide a transparent, no-pressure quote." },
    { title: "Surface Prep", desc: "We grind, repair, and prep the surface for a permanent, flawless bond." },
    { title: "Professional Install", desc: "Multi-layer system applied by experts — completed in one day." },
  ]
  return (
    <section id="how" className="py-16 px-4 bg-zinc-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center text-dark">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent text-black flex items-center justify-center text-xl font-bold">{i + 1}</div>
              <h3 className="text-lg font-semibold mb-1 text-dark">{s.title}</h3>
              <p className="text-sm text-zinc-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CostSection() {
  const tiers = [
    { size: "Small", range: "$1,200 – $2,200", sqft: "~200–250 sq ft" },
    { size: "Standard", range: "$2,000 – $3,800", sqft: "~400–500 sq ft" },
    { size: "Large", range: "$3,000 – $5,500", sqft: "~600–750 sq ft" },
  ]
  return (
    <section id="cost" className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-2 text-center text-dark">Cost & Pricing</h2>
        <p className="text-center text-zinc-600 mb-8">Transparent pricing — no surprises. See typical cost ranges for your size.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tiers.map((t, i) => (
            <div key={i} className="border border-zinc-200 rounded-xl p-6 text-center hover:shadow-lg transition">
              <h3 className="text-lg font-semibold mb-1 text-dark">{t.size} Space</h3>
              <p className="text-2xl font-bold text-dark mb-1">{t.range}</p>
              <p className="text-sm text-zinc-500">{t.sqft}</p>
            </div>
          ))}
        </div>
        <p className="text-center mt-8">
          <a href="#contact" className="inline-block bg-accent text-black px-6 py-3 rounded-lg font-bold hover:opacity-90 transition">
            Get My Exact Quote
          </a>
        </p>
      </div>
    </section>
  )
}

function FAQ() {
  const faqs = ${JSON.stringify(faq, null, 2)}
  const [open, setOpen] = useState(null)
  return (
    <section id="faq" className="py-16 px-4 bg-zinc-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center text-dark">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-5 py-4 font-semibold text-dark flex justify-between items-center hover:bg-zinc-50 transition"
              >
                {f.question}
                <span className="text-accent text-xl">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-zinc-600">{f.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" })
  const [status, setStatus] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setStatus("sending")
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus("success")
        setForm({ name: "", email: "", phone: "", message: "" })
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  return (
    <section id="contact" className="py-16 px-4">
      <div className="max-w-lg mx-auto">
        <h2 className="text-3xl font-bold mb-2 text-center text-dark">Get Your Free Estimate</h2>
        <p className="text-center text-zinc-600 mb-6">Fill out the form below or call {PHONE}</p>
        <form onSubmit={submit} className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 space-y-4">
          <input
            type="text" required placeholder="Your Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-accent focus:outline-none"
          />
          <input
            type="email" required placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-accent focus:outline-none"
          />
          <input
            type="tel" required placeholder="Phone" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-accent focus:outline-none"
          />
          <textarea
            placeholder="Project details, questions, preferred time" rows={3} value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-accent focus:outline-none"
          />
          <button
            type="submit" disabled={status === "sending"}
            className="w-full bg-accent text-black py-3.5 rounded-lg font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {status === "sending" ? "Sending..." : "Request My Free Estimate"}
          </button>
          {status === "success" && (
            <p className="text-green-600 text-sm text-center">Thank you! We'll contact you shortly.</p>
          )}
          {status === "error" && (
            <p className="text-red-600 text-sm text-center">Something went wrong. Please call {PHONE} instead.</p>
          )}
        </form>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-dark text-zinc-400 py-8 px-4 text-center text-sm">
      <p>&copy; {new Date().getFullYear()} {BRAND} · {CITY}, {STATE} · {PHONE}</p>
      <p className="mt-1 text-zinc-500">Professional {INDUSTRY} serving {CITY}, {STATE}</p>
    </footer>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Services />
      <HowItWorks />
      <CostSection />
      <FAQ />
      <ContactForm />
      <Footer />
    </div>
  )
}`;
}