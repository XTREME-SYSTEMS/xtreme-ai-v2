// autoBuildSiteGenerator — generates a REAL multi-page React + Vite + Tailwind
// application from an AutoBuild record's specs (architecture, data_model, ui_system).
// This replaces the generic template generator that was producing wrong-content sites.
// The generated app has routing, real pages, the actual platform's features and data
// models, styled with the UI system's colors and typography.

export function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parseSpec(spec) {
  if (!spec) return {};
  if (typeof spec === "string") { try { return JSON.parse(spec); } catch { return {}; } }
  return spec;
}

function extractColors(colorPalette) {
  const defaults = { primary: "#0a0a0a", accent: "#D4FF4D", dark: "#0a0a0a", light: "#ffffff" };
  if (!colorPalette) return defaults;
  const cp = parseSpec(colorPalette);
  return {
    primary: cp.primary || cp.main || cp.brand || cp.dark || defaults.primary,
    accent: cp.accent || cp.secondary || cp.highlight || cp.lime || defaults.accent,
    dark: cp.dark || cp.background || cp.darkest || defaults.dark,
    light: cp.light || cp.surface || cp.white || defaults.light,
  };
}

function pageToRoute(name) {
  const n = name.toLowerCase();
  if (n.includes("home") || n.includes("landing")) return "/";
  return "/" + slugify(name);
}

function pageToComponentName(name) {
  return name.split(/[^a-zA-Z0-9]+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}

function detectPageType(name) {
  const n = name.toLowerCase();
  if (n.includes("home") || n.includes("landing")) return "home";
  if (n.includes("search") || n.includes("browse") || n.includes("marketplace") || n.includes("listing")) return "search";
  if (n.includes("dashboard")) return "dashboard";
  if (n.includes("detail")) return "detail";
  if (n.includes("bidding") || n.includes("auction")) return "bidding";
  if (n.includes("contract")) return "contract";
  if (n.includes("negotiation")) return "negotiation";
  if (n.includes("analytics")) return "analytics";
  if (n.includes("signup") || n.includes("register") || n.includes("payment") || n.includes("subscription")) return "signup";
  if (n.includes("post") || n.includes("create") || n.includes("new")) return "form";
  if (n.includes("admin") || n.includes("manage") || n.includes("manager") || n.includes("source")) return "admin";
  if (n.includes("portal")) return "portal";
  return "generic";
}

// Main entry — generates all files for the React app from AutoBuild specs
export function generateAutoBuildApp(autobuild) {
  const arch = parseSpec(autobuild.architecture);
  const dataModel = parseSpec(autobuild.data_model);
  const uiSystem = parseSpec(autobuild.ui_system);
  const profile = autobuild.profile || {};
  const colors = extractColors(uiSystem.color_palette);

  const businessName = autobuild.business_name || "Platform";
  const tagline = profile.tagline || arch.summary?.slice(0, 80) || "";
  const industry = autobuild.industry || "";
  const concept = arch.concept || arch.summary || "";
  const summary = arch.summary || "";

  const pages = (arch.pages || []).map((p) => typeof p === "string" ? { name: p, description: "" } : p);
  const features = (arch.features || []).map((f) => typeof f === "string" ? { name: f, description: "" } : f);
  const entities = (dataModel.entities || arch.data_models || []).map((e) => typeof e === "string" ? { name: e } : e);
  const integrations = (arch.integrations || []).map((i) => typeof i === "string" ? { name: i } : i);
  const userFlows = arch.user_flows || [];

  // Filter out the home page from the pages list (we generate it separately)
  const navPages = pages.filter((p) => {
    const n = (p.name || "").toLowerCase();
    return !n.includes("home") && !n.includes("landing");
  });

  const files = {};

  // ---- Config files ----
  files["package.json"] = JSON.stringify({
    name: slugify(businessName),
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      "react-router-dom": "^6.26.0",
    },
    devDependencies: {
      "@vitejs/plugin-react": "^4.2.0",
      autoprefixer: "^10.4.16",
      postcss: "^8.4.32",
      tailwindcss: "^3.4.0",
      vite: "^5.0.0",
    },
  }, null, 2);

  files["vite.config.js"] = `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})`;

  files["tailwind.config.js"] = `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ['./index.html', './src/**/*.{js,jsx}'],\n  theme: {\n    extend: {\n      colors: {\n        brand: '${colors.primary}',\n        accent: '${colors.accent}',\n        dark: '${colors.dark}',\n        light: '${colors.light}',\n      },\n    },\n  },\n  plugins: [],\n}`;

  files["postcss.config.js"] = `export default {\n  plugins: { tailwindcss: {}, autoprefixer: {} },\n}`;

  files["vercel.json"] = JSON.stringify({
    rewrites: [{ source: "/(.*)", destination: "/index.html" }],
  }, null, 2);

  const domain = autobuild.deployment?.live_url?.replace(/^https?:\/\//, "") || `${slugify(businessName)}.vercel.app`;
  files["index.html"] = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${businessName} | ${industry}</title>\n  <meta name="description" content="${summary.slice(0, 160).replace(/"/g, '&quot;')}" />\n  <link rel="canonical" href="https://${domain}/" />\n  <meta property="og:title" content="${businessName}" />\n  <meta property="og:description" content="${summary.slice(0, 160).replace(/"/g, '&quot;')}" />\n  <meta property="og:type" content="website" />\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.jsx"></script>\n</body>\n</html>`;

  // ---- Source files ----
  files["src/main.jsx"] = `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)`;

  files["src/index.css"] = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nhtml { scroll-behavior: smooth; }\nbody { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: ${colors.dark}; background: ${colors.light}; }`;

  // App.jsx with router
  const pageImports = navPages.map((p) => {
    const comp = pageToComponentName(p.name);
    return `import ${comp} from './pages/${comp}.jsx'`;
  }).join("\n");

  const pageRoutes = navPages.map((p) => {
    const comp = pageToComponentName(p.name);
    const route = pageToRoute(p.name);
    return `          <Route path="${route}" element={<${comp} />} />`;
  }).join("\n");

  files["src/App.jsx"] = `import { BrowserRouter, Routes, Route } from 'react-router-dom'\nimport Navbar from './components/Navbar.jsx'\nimport Footer from './components/Footer.jsx'\nimport Home from './pages/Home.jsx'\n${pageImports}\n\nexport default function App() {\n  return (\n    <BrowserRouter>\n      <div className="min-h-screen flex flex-col">\n        <Navbar />\n        <main className="flex-1">\n          <Routes>\n            <Route path="/" element={<Home />} />\n${pageRoutes}\n          </Routes>\n        </main>\n        <Footer />\n      </div>\n    </BrowserRouter>\n  )\n}`;

  // Navbar
  const navLinks = navPages.slice(0, 6).map((p) => {
    const route = pageToRoute(p.name);
    const label = p.name.split(/[/|-]/).pop().trim().slice(0, 20);
    return `        <a href="${route}" className="hover:text-accent transition">{label}</a>`;
  }).join("\n");

  files["src/components/Navbar.jsx"] = `export default function Navbar() {\n  return (\n    <header className="sticky top-0 z-50 bg-brand text-white py-3 px-4 shadow-lg">\n      <div className="max-w-6xl mx-auto flex items-center justify-between">\n        <a href="/" className="text-lg font-bold">${businessName}</a>\n        <nav className="hidden sm:flex gap-5 text-sm">\n${navLinks}\n        </nav>\n        <a href="/signup" className="bg-accent text-black px-4 py-1.5 rounded-lg text-sm font-semibold hover:opacity-90 transition">Get Started</a>\n      </div>\n    </header>\n  )\n}`;

  // Footer
  files["src/components/Footer.jsx"] = `export default function Footer() {\n  return (\n    <footer className="bg-brand text-white/70 py-8 px-4 text-center text-sm">\n      <p>&copy; {new Date().getFullYear()} ${businessName}. All rights reserved.</p>\n      <p className="mt-1 text-white/50">${tagline}</p>\n    </footer>\n  )\n}`;

  // Home page
  files["src/pages/Home.jsx"] = generateHome({ businessName, tagline, industry, concept, summary, features, entities, integrations, userFlows, colors });

  // Other pages
  for (const page of navPages) {
    const comp = pageToComponentName(page.name);
    files[`src/pages/${comp}.jsx`] = generatePage(page, { businessName, industry, entities, features, colors });
  }

  // Public files
  files["public/robots.txt"] = `User-agent: *\nAllow: /\n\nSitemap: https://${domain}/sitemap.xml`;
  const pageUrls = navPages.map((p) => `  <url><loc>https://${domain}${pageToRoute(p.name)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join("\n");
  files["public/sitemap.xml"] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://${domain}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n${pageUrls}\n</urlset>`;

  files["README.md"] = `# ${businessName}\n\n${summary}\n\n## Tech Stack\n- React 18 + Vite 5 + Tailwind CSS 3\n- React Router for multi-page navigation\n- ${entities.length} data models\n- ${features.length} features\n- ${integrations.length} integrations\n\n## Pages\n${pages.map((p) => `- ${p.name}`).join("\n")}\n\n## Development\n\`\`\`bash\nnpm install\nnpm run dev\nnpm run build\n\`\`\`\n\nGenerated by the Lead Gen Near You Auto Builder.\n`;

  return files;
}

// ---- Home page generator ----
function generateHome({ businessName, tagline, industry, concept, summary, features, entities, integrations, userFlows, colors }) {
  const featuresGrid = features.slice(0, 8).map((f, i) => `        <div key={${i}} className="border border-zinc-200 rounded-xl p-6 hover:shadow-lg transition">\n          <h3 className="text-lg font-semibold mb-2">${f.name || f.title || `Feature ${i + 1}`}</h3>\n          <p className="text-sm text-zinc-600">${(f.description || "").slice(0, 120)}</p>\n        </div>`).join("\n");

  const entitiesList = entities.slice(0, 10).map((e, i) => `          <div key={${i}} className="border border-zinc-200 rounded-lg p-3 text-center">\n            <div className="text-sm font-semibold">${e.name || e.title || `Entity ${i + 1}`}</div>\n          </div>`).join("\n");

  const integrationsList = integrations.slice(0, 6).map((i, idx) => `          <span key={${idx}} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">${i.name || i}</span>`).join("\n");

  const flowsList = userFlows.slice(0, 4).map((f, i) => `          <div className="flex items-start gap-3">\n            <div className="w-8 h-8 rounded-full bg-accent text-black flex items-center justify-center font-bold text-sm shrink-0">${i + 1}</div>\n            <p className="text-sm text-zinc-600 pt-1">${f}</p>\n          </div>`).join("\n");

  return `export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand to-zinc-800 text-white py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">${businessName}</h1>
          <p className="text-lg text-white/85 mb-6 max-w-xl mx-auto">${tagline || summary.slice(0, 120)}</p>
          <div className="flex gap-3 justify-center">
            <a href="/signup" className="bg-accent text-black px-7 py-3.5 rounded-lg font-bold text-lg hover:opacity-90 transition">Get Started</a>
            <a href="#features" className="border border-white/30 px-7 py-3.5 rounded-lg font-bold text-lg hover:bg-white/10 transition">Learn More</a>
          </div>
        </div>
      </section>

      {/* Concept */}
      ${concept ? `<section className="py-16 px-4 bg-zinc-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">What is ${businessName}?</h2>
          <p className="text-zinc-600">${concept.slice(0, 500)}</p>
        </div>
      </section>` : ""}

      {/* Features */}
      <section id="features" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Platform Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
${featuresGrid}
          </div>
        </div>
      </section>

      {/* How It Works */}
      ${userFlows.length > 0 ? `<section className="py-16 px-4 bg-zinc-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
          <div className="space-y-4">
${flowsList}
          </div>
        </div>
      </section>` : ""}

      {/* Data Models */}
      ${entities.length > 0 ? `<section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Core Data Models</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
${entitiesList}
          </div>
        </div>
      </section>` : ""}

      {/* Integrations */}
      ${integrations.length > 0 ? `<section className="py-16 px-4 bg-zinc-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Integrations</h2>
          <div className="flex flex-wrap justify-center gap-2">
${integrationsList}
          </div>
        </div>
      </section>` : ""}

      {/* CTA */}
      <section className="py-16 px-4 bg-brand text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-white/80 mb-6">Join ${businessName} today and get access to our full platform.</p>
          <a href="/signup" className="bg-accent text-black px-7 py-3.5 rounded-lg font-bold text-lg hover:opacity-90 transition">Sign Up Now</a>
        </div>
      </section>
    </div>
  )
}`;
}

// ---- Generic page generator (handles all page types) ----
function generatePage(page, { businessName, industry, entities, features, colors }) {
  const name = page.name || "Page";
  const desc = page.description || "";
  const type = detectPageType(name);

  let content = "";

  if (type === "search") {
    content = `      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <div className="border border-zinc-200 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-500">Filters</h3>
              <div><label className="text-xs text-zinc-500">Search</label><input className="w-full mt-1 px-3 py-2 border border-zinc-300 rounded-lg text-sm" placeholder="Search..." /></div>
              <div><label className="text-xs text-zinc-500">Category</label><select className="w-full mt-1 px-3 py-2 border border-zinc-300 rounded-lg text-sm"><option>All</option><option>Residential</option><option>Commercial</option><option>Distressed</option></select></div>
              <div><label className="text-xs text-zinc-500">Price Range</label><div className="flex gap-2 mt-1"><input className="w-1/2 px-2 py-2 border border-zinc-300 rounded-lg text-sm" placeholder="Min" /><input className="w-1/2 px-2 py-2 border border-zinc-300 rounded-lg text-sm" placeholder="Max" /></div></div>
              <button className="w-full bg-accent text-black py-2 rounded-lg font-semibold text-sm">Apply Filters</button>
            </div>
          </aside>
          <div className="lg:col-span-3 space-y-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="border border-zinc-200 rounded-xl p-4 flex gap-4 hover:shadow-lg transition">
                <div className="w-32 h-32 bg-zinc-200 rounded-lg shrink-0"></div>
                <div className="flex-1">
                  <h3 className="font-semibold">Property #{i}</h3>
                  <p className="text-sm text-zinc-500">123 Main St, City, ST</p>
                  <div className="flex gap-2 mt-2"><span className="text-xs bg-zinc-100 px-2 py-1 rounded">3 BD</span><span className="text-xs bg-zinc-100 px-2 py-1 rounded">2 BA</span><span className="text-xs bg-accent/20 text-accent-700 px-2 py-1 rounded font-semibold">Score: 85</span></div>
                  <p className="text-lg font-bold mt-2">$250,000</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>`;
  } else if (type === "dashboard") {
    content = `      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[["Active", "12"], ["Pending", "5"], ["Completed", "28"], ["Total Value", "$1.2M"]].map(([label, val]) => (
            <div key={label} className="border border-zinc-200 rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
              <div className="text-2xl font-bold mt-1">{val}</div>
            </div>
          ))}
        </div>
        <div className="border border-zinc-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs"><tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Value</th><th className="text-left px-4 py-3">Date</th></tr></thead>
            <tbody>
              {[1,2,3,4,5].map(i => (
                <tr key={i} className="border-t border-zinc-100"><td className="px-4 py-3">Item {i}</td><td className="px-4 py-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span></td><td className="px-4 py-3">$50,000</td><td className="px-4 py-3 text-zinc-500">Aug {i}, 2026</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>`;
  } else if (type === "bidding") {
    content = `      <div className="max-w-3xl mx-auto">
        <div className="border border-zinc-200 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div><h3 className="text-xl font-bold">Property Auction</h3><p className="text-sm text-zinc-500">123 Main St, City, ST</p></div>
            <div className="text-right"><div className="text-xs uppercase text-zinc-500">Time Left</div><div className="text-2xl font-bold text-red-500">02:45:30</div></div>
          </div>
          <div className="bg-zinc-50 rounded-lg p-4 mb-4"><div className="text-xs text-zinc-500">Current Highest Bid</div><div className="text-3xl font-bold">$245,000</div></div>
          <div className="space-y-2 mb-4">
            {[["User A", "$245,000", "2h ago"], ["User B", "$240,000", "3h ago"], ["User C", "$235,000", "4h ago"]].map(([user, bid, time], i) => (
              <div key={i} className="flex justify-between text-sm border-b border-zinc-100 py-2"><span>{user}</span><span className="font-semibold">{bid}</span><span className="text-zinc-400">{time}</span></div>
            ))}
          </div>
          <div className="flex gap-2"><input className="flex-1 px-4 py-3 border border-zinc-300 rounded-lg" placeholder="Enter your bid ($)" /><button className="bg-accent text-black px-6 py-3 rounded-lg font-bold">Place Bid</button></div>
        </div>
      </div>`;
  } else if (type === "contract") {
    content = `      <div className="max-w-3xl mx-auto">
        <div className="border border-zinc-200 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Smart Contract</h3>
          <div className="space-y-3 mb-6">
            {[["Property", "123 Main St, City, ST"], ["Buyer", "Investor Name"], ["Seller", "Owner Name"], ["Price", "$250,000"], ["Earnest Money", "$5,000"], ["Closing Date", "30 days"]].map(([label, val]) => (
              <div key={label} className="flex justify-between border-b border-zinc-100 py-2"><span className="text-zinc-500 text-sm">{label}</span><span className="font-semibold text-sm">{val}</span></div>
            ))}
          </div>
          <div className="bg-zinc-50 rounded-lg p-4 mb-6 text-sm text-zinc-600">This smart contract is deployed on the Polygon blockchain. Once both parties sign, the contract is immutable and the escrow is automatically managed on-chain.</div>
          <div className="flex gap-3"><button className="flex-1 bg-accent text-black py-3 rounded-lg font-bold">Sign Contract</button><button className="border border-zinc-300 px-6 py-3 rounded-lg font-semibold">Download</button></div>
        </div>
      </div>`;
  } else if (type === "negotiation") {
    content = `      <div className="max-w-3xl mx-auto">
        <div className="border border-zinc-200 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">AI Negotiation Assistant</h3>
          <div className="space-y-3 mb-6 min-h-[300px]">
            <div className="bg-zinc-50 rounded-lg p-3 text-sm"><strong>AI:</strong> Welcome! I've analyzed the current offer of $230,000 for this property. Based on comparable sales and the property's condition, I recommend a counter-offer of $245,000.</div>
            <div className="bg-accent/10 rounded-lg p-3 text-sm text-right"><strong>You:</strong> What about the repair costs?</div>
            <div className="bg-zinc-50 rounded-lg p-3 text-sm"><strong>AI:</strong> Estimated repair costs are $15,000. I've factored this into the valuation. The property's distressed score is 72/100, supporting the counter-offer.</div>
          </div>
          <div className="flex gap-2"><input className="flex-1 px-4 py-3 border border-zinc-300 rounded-lg" placeholder="Ask the AI..." /><button className="bg-accent text-black px-6 py-3 rounded-lg font-bold">Send</button></div>
        </div>
      </div>`;
  } else if (type === "analytics") {
    content = `      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[["ROI", "+24%"], ["Avg Deal", "$85K"], ["Win Rate", "68%"], ["Portfolio", "$2.1M"]].map(([label, val]) => (
            <div key={label} className="border border-zinc-200 rounded-xl p-5"><div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div><div className="text-2xl font-bold mt-1">{val}</div></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-zinc-200 rounded-xl p-6"><h3 className="font-semibold mb-4">Monthly Performance</h3><div className="flex items-end gap-2 h-40">{[40,65,50,80,60,90,75,85].map((h, i) => <div key={i} className="flex-1 bg-accent rounded-t" style={{height: h + '%'}}></div>)}</div></div>
          <div className="border border-zinc-200 rounded-xl p-6"><h3 className="font-semibold mb-4">Market Trends</h3><div className="space-y-2">{["Median price up 8% YoY", "Inventory down 12%", "Days on market: 45 avg", "Distressed properties: 234 active"].map((t, i) => <div key={i} className="text-sm text-zinc-600 border-b border-zinc-100 py-2">{t}</div>)}</div></div>
        </div>
      </div>`;
  } else if (type === "signup") {
    content = `      <div className="max-w-md mx-auto">
        <div className="border border-zinc-200 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Choose Your Plan</h3>
          <div className="space-y-3 mb-6">
            {[["Starter", "$49/mo", "Basic access"], ["Pro", "$149/mo", "Full access + analytics"], ["Elite", "$499/mo", "Everything + priority support"]].map(([plan, price, desc]) => (
              <div key={plan} className="border border-zinc-200 rounded-lg p-4 flex justify-between items-center"><div><div className="font-semibold">{plan}</div><div className="text-xs text-zinc-500">{desc}</div></div><div className="text-right"><div className="font-bold">{price}</div><button className="mt-1 text-xs bg-accent text-black px-3 py-1 rounded font-semibold">Select</button></div></div>
            ))}
          </div>
          <div className="space-y-3"><input className="w-full px-4 py-3 border border-zinc-300 rounded-lg" placeholder="Full Name" /><input className="w-full px-4 py-3 border border-zinc-300 rounded-lg" placeholder="Email" /><input className="w-full px-4 py-3 border border-zinc-300 rounded-lg" placeholder="Password" type="password" /><button className="w-full bg-accent text-black py-3 rounded-lg font-bold">Sign Up</button></div>
        </div>
      </div>`;
  } else if (type === "form") {
    content = `      <div className="max-w-2xl mx-auto">
        <div className="border border-zinc-200 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Post a New Listing</h3>
          <div className="space-y-4">
            <div><label className="text-sm text-zinc-500">Title</label><input className="w-full mt-1 px-4 py-2.5 border border-zinc-300 rounded-lg" placeholder="Property title" /></div>
            <div><label className="text-sm text-zinc-500">Address</label><input className="w-full mt-1 px-4 py-2.5 border border-zinc-300 rounded-lg" placeholder="Property address" /></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-zinc-500">Type</label><select className="w-full mt-1 px-4 py-2.5 border border-zinc-300 rounded-lg"><option>Residential</option><option>Commercial</option><option>Distressed</option></select></div><div><label className="text-sm text-zinc-500">Asking Price</label><input className="w-full mt-1 px-4 py-2.5 border border-zinc-300 rounded-lg" placeholder="$" /></div></div>
            <div><label className="text-sm text-zinc-500">Description</label><textarea className="w-full mt-1 px-4 py-2.5 border border-zinc-300 rounded-lg" rows={4} placeholder="Describe the property..."></textarea></div>
            <button className="bg-accent text-black px-6 py-3 rounded-lg font-bold">Post Listing</button>
          </div>
        </div>
      </div>`;
  } else if (type === "admin") {
    content = `      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[["Users", "1,234"], ["Listings", "567"], ["Active Bids", "89"], ["Revenue", "$45K"]].map(([label, val]) => (
            <div key={label} className="border border-zinc-200 rounded-xl p-5"><div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div><div className="text-2xl font-bold mt-1">{val}</div></div>
          ))}
        </div>
        <div className="border border-zinc-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs"><tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Type</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Actions</th></tr></thead>
            <tbody>{[1,2,3,4,5,6,7,8].map(i => <tr key={i} className="border-t border-zinc-100"><td className="px-4 py-3">Item {i}</td><td className="px-4 py-3 text-zinc-500">Type</td><td className="px-4 py-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span></td><td className="px-4 py-3"><button className="text-accent-600 text-xs font-semibold">Edit</button></td></tr>)}</tbody>
          </table>
        </div>
      </div>`;
  } else if (type === "portal") {
    content = `      <div className="max-w-md mx-auto">
        <div className="border border-zinc-200 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Portal Login</h3>
          <div className="space-y-3"><input className="w-full px-4 py-3 border border-zinc-300 rounded-lg" placeholder="Email" /><input className="w-full px-4 py-3 border border-zinc-300 rounded-lg" placeholder="Password" type="password" /><button className="w-full bg-accent text-black py-3 rounded-lg font-bold">Log In</button></div>
          <p className="text-center text-sm text-zinc-500 mt-4">Don't have an account? <a href="/signup" className="text-accent-600 font-semibold">Sign up</a></p>
        </div>
      </div>`;
  } else {
    // Generic page
    content = `      <div className="max-w-3xl mx-auto">
        <p className="text-zinc-600">${desc || "This page is part of the " + businessName + " platform."}</p>
        <div className="mt-8 space-y-4">
          ${entities.slice(0, 4).map((e, i) => `<div key={${i}} className="border border-zinc-200 rounded-lg p-4"><h4 className="font-semibold">${e.name || "Section " + (i + 1)}</h4><p className="text-sm text-zinc-500 mt-1">Data and functionality related to ${e.name || "this section"}.</p></div>`).join("\n          ")}
        </div>
      </div>`;
  }

  return `export default function ${pageToComponentName(name)}() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">${name}</h1>
        ${desc ? `<p className="text-zinc-500">{desc}</p>` : ""}
      </div>
${content}
    </div>
  )
}`;
}