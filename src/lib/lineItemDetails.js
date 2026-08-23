// Keyword-based detailed descriptions for package line items.
// getLineItemDetail() scans the line item text for matching keywords
// (case-insensitive, first match wins) and returns a human-friendly
// explanation of what that item is and what the client gets.
const DETAILS = [
  {
    match: ["onboarding", "intake", "business profile intake"],
    detail: "You'll fill out a short digital form telling us about your business — industry, services, service area, and contact info. This feeds our AI so every deliverable is tailored to your business.",
  },
  {
    match: ["logo generator", "logo concept"],
    detail: "Our AI creates 10 custom logo concepts from your business name and industry. You pick your favorite. All logos include transparent backgrounds (PNG + SVG) so they work on any website or print theme.",
  },
  {
    match: ["brand generator", "brand mockup"],
    detail: "We apply your chosen logo to 10 real-world mockups — business cards, brochures, apparel, vehicle wraps and more — so you can see your brand in action. Pick your favorites; all are included as print-ready digital files.",
  },
  {
    match: ["website design", "web design pack"],
    detail: "We design 10 distinct website layouts with your logo and brand colors. Preview each in desktop and mobile, toggle color schemes, and pick the one you love. You can comment on or regenerate any section.",
  },
  {
    match: ["website build"],
    detail: "Our team builds your custom website from your chosen design direction — converting the mockup into a live, responsive site with your content, images, and lead capture forms wired up.",
  },
  {
    match: ["hero", "about", "services & faq", "copy written"],
    detail: "Our AI writes professional website copy for your Home, About, Services, and FAQ pages — tailored to your industry and local market. You can request revisions on any section.",
  },
  {
    match: ["ai-generated", "project imagery", "imagery"],
    detail: "We generate custom, industry-relevant images for your website using AI — project photos, team imagery, and lifestyle shots. All images are web-optimized and match your brand aesthetic.",
  },
  {
    match: ["mobile-responsive", "responsive design"],
    detail: "Your website automatically adapts to look great on phones, tablets, and desktops. Over 60% of local searches happen on mobile, so this is critical for capturing leads.",
  },
  {
    match: ["on-page seo", "seo optimization"],
    detail: "We optimize every page's title tags, meta descriptions, headings, and content for your target keywords so Google understands what you do and where you do it.",
  },
  {
    match: ["aeo", "ai-search", "answer optimization"],
    detail: "AI Search Engine Optimization (AEO) structures your content so AI search engines like ChatGPT, Perplexity, and Google AI Overviews can cite your business as a trusted answer source.",
  },
  {
    match: ["json-ld", "structured data"],
    detail: "We add JSON-LD structured data (schema markup) to your site so search engines can display rich snippets — star ratings, pricing, services, and business info directly in search results.",
  },
  {
    match: ["lead capture", "lead form", "form wiring"],
    detail: "We wire up a contact/lead capture form on your website so visitor inquiries are sent directly to your email and tracked in your portal. Every lead is captured — nothing falls through the cracks.",
  },
  {
    match: ["domain selection"],
    detail: "We help you choose the right domain name for your business — one that's memorable, keyword-relevant for local SEO, and available to register.",
  },
  {
    match: ["hosting", "deployment", "deploy to"],
    detail: "We host your website on fast, reliable infrastructure and deploy it to a live URL. Your site stays online 24/7 with automatic SSL, backups, and uptime monitoring.",
  },
  {
    match: ["rank engine"],
    detail: "Our autonomous SEO engine generates city-service pages, builds local citations, and reaches out for backlinks — all to push your site up the Google rankings for your target keywords.",
  },
  {
    match: ["gsc", "google search console", "indexing"],
    detail: "We connect your site to Google Search Console, submit your sitemap, and request indexing for every page so Google discovers and ranks your content faster.",
  },
  {
    match: ["content refresh", "ongoing content", "content optimization"],
    detail: "We continuously refresh and expand your website content — adding new pages, updating existing copy, and keeping everything current so Google sees your site as active and authoritative.",
  },
  {
    match: ["launch", "go-live"],
    detail: "We handle the full launch process — final QA, DNS configuration, SSL setup, and go-live — so your website is live and ready to capture leads on day one.",
  },
  {
    match: ["monthly execution", "monthly reporting", "priority reporting"],
    detail: "Every month, our team executes your ongoing services and delivers a report showing what was done, rankings progress, traffic data, and leads generated.",
  },
  {
    match: ["dedicated project lead", "project lead"],
    detail: "You get a dedicated project lead who coordinates your entire build, answers your questions, and keeps your project on track from start to launch.",
  },
  {
    match: ["social media kit", "social media pack", "social post", "social template"],
    detail: "We design on-brand social media templates — profile picture, cover, story templates, and post templates — plus a 30-day content calendar with captions and best posting times.",
  },
  {
    match: ["video concept", "video pack", "promo video"],
    detail: "We create short promotional videos for your business using your brand, logo, and content. Use them on your website, social media, or YouTube to grab attention.",
  },
  {
    match: ["business card"],
    detail: "We design professional digital business cards (front and back) with your logo and contact info. Print-ready files you can send to any printer.",
  },
  {
    match: ["brochure", "tri-fold"],
    detail: "We design a digital tri-fold brochure showcasing your services with compelling copy and your brand. Print-ready file included.",
  },
  {
    match: ["flyer", "marketing flyer"],
    detail: "We design a digital marketing flyer to promote your services. Great for handouts, mailers, or digital sharing. Print-ready file included.",
  },
  {
    match: ["t-shirt", "apparel"],
    detail: "We create a branded t-shirt design mockup with your logo. Print-ready file so you can order uniforms for your team.",
  },
  {
    match: ["hat", "cap"],
    detail: "We design an embroidered hat/cap mockup with your logo. Print-ready file for ordering branded headwear.",
  },
  {
    match: ["vehicle", "van wrap"],
    detail: "We design a vehicle/van wrap mockup with your brand — turns your work vehicle into a moving billboard. Print-ready file included.",
  },
  {
    match: ["storefront", "signage"],
    detail: "We design storefront signage mockups with your logo and brand. Print-ready files for ordering physical signs.",
  },
  {
    match: ["uniform", "work uniform"],
    detail: "We design branded work uniform mockups so your team looks professional on every job. Print-ready file included.",
  },
  {
    match: ["mobile app mockup", "app mockup"],
    detail: "We create a digital mockup of a mobile app interface with your branding — shows what a customer-facing app could look like.",
  },
  {
    match: ["native ios", "ios app", "app store"],
    detail: "We package your site/brand into a native iOS app and submit it to the App Store. Includes app icons, splash screens, and push notification setup.",
  },
  {
    match: ["native android", "android app", "google play"],
    detail: "We package your site/brand into a native Android app and submit it to Google Play. Includes app icons, splash screens, and push notification setup.",
  },
  {
    match: ["push notification"],
    detail: "We set up push notifications so you can send instant alerts to your app users — promotions, updates, or appointment reminders.",
  },
  {
    match: ["app icon", "splash screen"],
    detail: "We design app icons and splash screens that match your brand, required for App Store and Google Play submission.",
  },
  {
    match: ["citation", "directory submission"],
    detail: "We submit your business to local citation directories (Yelp, BBB, Angi, etc.) to boost your local search visibility and build authority.",
  },
  {
    match: ["backlink", "outreach"],
    detail: "We find relevant websites in your niche, draft personalized outreach emails, and track responses to build backlinks that boost your search rankings.",
  },
  {
    match: ["gbp", "google business profile"],
    detail: "We set up and optimize your Google Business Profile for maximum local search visibility — categories, service area, photos, and review requests.",
  },
  {
    match: ["call tracking"],
    detail: "We set up a dedicated tracking phone number with call recording and analytics so you can measure exactly how many leads come from your marketing.",
  },
  {
    match: ["review request", "review system", "reputation"],
    detail: "We set up an automated system that sends review requests to your customers after job completion, boosting your Google rating and local trust.",
  },
  {
    match: ["competitor analysis", "competitor scan", "competitor intel"],
    detail: "We analyze your top competitors' websites, content, and rankings to identify gaps and opportunities we can exploit to outrank them.",
  },
  {
    match: ["keyword research", "keyword"],
    detail: "We research the exact search terms your customers use, including search volume, cost-per-click, and ranking difficulty, to target the highest-value keywords.",
  },
  {
    match: ["technical seo", "seo audit"],
    detail: "We run a full technical SEO audit — Core Web Vitals, schema validation, mobile-friendliness, and crawl errors — and deliver a prioritized fix list.",
  },
  {
    match: ["chatbot"],
    detail: "We deploy an AI chatbot on your website that answers visitor questions, qualifies leads, and books appointments 24/7 — even when you're asleep.",
  },
  {
    match: ["content distribution", "syndication"],
    detail: "We syndicate your content across web channels and social platforms to maximize reach and get your content indexed faster.",
  },
  {
    match: ["rank alert", "rank tracking", "ranking monitor"],
    detail: "We track your keyword positions daily and alert you the moment a ranking drops, with recommended recovery actions.",
  },
  {
    match: ["site maintenance"],
    detail: "We keep your website updated, secure, and fast — security monitoring, performance optimization, content updates, and uptime monitoring.",
  },
  {
    match: ["lead gen", "lead generation", "lead discovery"],
    detail: "Our AI discovers high-value prospects in your area, scores them, and nurtures them through automated sequences so you get a steady pipeline of leads.",
  },
  {
    match: ["enhancement", "add-on"],
    detail: "Browse optional AI tools and add-ons to enhance your package. Try live branded demos of each before deciding what to include.",
  },
  {
    match: ["esign", "service agreement", "sign your"],
    detail: "You'll review and sign your service agreement electronically. This locks in your scope and lets our team begin the build.",
  },
  {
    match: ["design approval", "approve your website design"],
    detail: "Before anything goes live, you review and approve your website design. Nothing is published without your sign-off.",
  },
  {
    match: ["receipt", "launch track", "track your launch"],
    detail: "Every action our team takes to build and launch your website is logged here for full transparency — you can see exactly what's happening.",
  },
];

export function getLineItemDetail(text) {
  const lower = text.toLowerCase();
  for (const d of DETAILS) {
    if (d.match.some((m) => lower.includes(m))) return d.detail;
  }
  return null;
}