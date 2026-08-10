// Shared provisioning engine for the AI site factory.
// Imported by the provisionMarket orchestrator (and reusable by any future
// granular provision-* function). Each step is self-contained and returns its
// result so the orchestrator can persist partial progress on ProvisioningRecord.

export function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function b64(s) {
  return btoa(unescape(encodeURIComponent(String(s))));
}

// ---- Static site generation -------------------------------------------------
// Builds a clean, SEO-optimized static site from the market + generated SEO.
// Returns a { path: content } map ready to push to GitHub.
export function generateSiteFiles(market, seo) {
  const domain = market.domain || `${market.slug || slugify(market.state + "-" + market.city)}.leadgennearyou.com`;
  const brand = market.public_business_name || market.brand_name || "Epoxy Garage Floor Estimate";
  const phone = market.phone || "(555) 123-4567";
  const city = market.city, state = market.state;
  const area = market.service_area_description || `${city}, ${state}`;
  const metaTitle = seo?.meta_title || `${brand} | Garage Floor Coating ${city}, ${state}`;
  const metaDesc = seo?.meta_description || `Professional garage floor coating & epoxy flooring in ${city}, ${state}. Free estimates, durable finish, fast installation. Call ${phone}.`;
  const faq = seo?.faq || [];
  const jsonLd = seo?.json_ld?.localbusiness || { "@context": "https://schema.org", "@type": "LocalBusiness", name: brand, telephone: phone, areaServed: `${city}, ${state}` };
  const faqLd = seo?.json_ld?.faq || { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(f => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) };

  const head = (title, desc, path) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="https://${domain}/${path}">
  <meta property="og:title" content="${seo?.og_title || title}">
  <meta property="og:description" content="${seo?.og_description || desc}">
  <meta property="og:type" content="website">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
  <style>
    *{margin:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;background:#fff;line-height:1.6}
    .wrap{max-width:1100px;margin:0 auto;padding:0 20px}
    header{position:sticky;top:0;background:#0a0a0a;color:#fff;padding:14px 0;z-index:10}
    header a{color:#fff;text-decoration:none;margin-left:18px;font-size:14px}
    header .brand{font-weight:700;font-size:18px}
    .hero{background:linear-gradient(135deg,#0a0a0a,#1a1a1a);color:#fff;padding:70px 0;text-align:center}
    .hero h1{font-size:38px;margin-bottom:14px;max-width:800px;margin-inline:auto}
    .hero p{font-size:18px;opacity:.85;max-width:640px;margin:0 auto 22px}
    .btn{display:inline-block;background:#D4FF4D;color:#000;padding:13px 26px;border-radius:8px;font-weight:700;text-decoration:none;font-size:16px}
    section{padding:54px 0}
    h2{font-size:28px;margin-bottom:18px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px}
    .card{border:1px solid #e2e8f0;border-radius:12px;padding:22px}
    .card h3{font-size:18px;margin-bottom:8px}
    details{border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin-bottom:10px}
    summary{font-weight:600;cursor:pointer}
    footer{background:#0a0a0a;color:#9ca3af;padding:30px 0;text-align:center;font-size:14px}
    .lead{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:26px;max-width:560px;margin:0 auto}
    .lead input,.lead textarea{width:100%;padding:10px;margin-bottom:10px;border:1px solid #cbd5e1;border-radius:6px;font-size:15px}
    @media(max-width:640px){.hero h1{font-size:28px}}
  </style>
</head>
<body>
<header><div class="wrap" style="display:flex;align-items:center;justify-content:space-between"><span class="brand">${brand}</span><nav><a href="/">Home</a><a href="/cost.html">Cost</a><a href="/#faq">FAQ</a><a href="/#contact">Contact</a></nav></div></header>`;

  const footer = `<footer><div class="wrap"><p>&copy; ${new Date().getFullYear()} ${brand} · ${city}, ${state} · ${phone}</p></div></footer>
</body>
</html>`;

  const indexHtml = `${head(metaTitle, metaDesc, "")}
<section class="hero"><div class="wrap"><h1>Garage Floor Coating in ${city}, ${state}</h1><p>Durable, seamless epoxy & polyaspartic garage floor coatings built to last. Free estimates, expert installation, and a finish that transforms your garage.</p><a class="btn" href="#contact">Get My Free Estimate</a><p style="margin-top:14px;font-size:14px;opacity:.7">Call ${phone}</p></div></section>
<section><div class="wrap"><h2>Our Garage Floor Coating Services</h2><div class="grid">
<div class="card"><h3>Full-Broadcast Flake Systems</h3><p>Decorative flake coatings that hide imperfections and resist stains — available in dozens of color blends.</p></div>
<div class="card"><h3>Metallic Epoxy Floors</h3><p>High-gloss, three-dimensional metallic finishes for a premium, one-of-a-kind garage look.</p></div>
<div class="card"><h3>Polyaspartic Coating</h3><p>Fast-curing, UV-stable coatings that can be driven on the same day — ideal for ${state} climates.</p></div>
<div class="card"><h3>Concrete Prep & Repair</h3><p>Professional grinding, crack filling, and surface prep for a flawless, long-lasting bond.</p></div>
</div></div></section>
<section style="background:#f8fafc"><div class="wrap"><h2>How It Works</h2><div class="grid">
<div class="card"><h3>1. Free Estimate</h3><p>Share your garage size and we'll provide a transparent, no-pressure quote.</p></div>
<div class="card"><h3>2. Surface Prep</h3><p>We grind, repair, and prep the concrete for a permanent bond.</p></div>
<div class="card"><h3>3. Coating Install</h3><p>Multi-layer system applied in one day — back to using your garage fast.</p></div>
</div></div></section>
<section id="faq"><div class="wrap"><h2>Frequently Asked Questions</h2>
${faq.map(f => `<details><summary>${f.question}</summary><p style="margin-top:8px;color:#475569">${f.answer}</p></details>`).join("")}
</div></section>
<section id="contact" style="background:#f8fafc"><div class="wrap"><h2>Get Your Free Estimate</h2>
<form class="lead" action="https://${domain}/api/lead" method="POST">
  <input name="name" placeholder="Your name" required>
  <input name="email" type="email" placeholder="Email" required>
  <input name="phone" type="tel" placeholder="Phone" required>
  <textarea name="message" rows="3" placeholder="Garage size, questions, preferred time"></textarea>
  <button class="btn" type="submit">Request My Free Estimate</button>
</form></div></section>
${footer}`;

  const costHtml = `${head(`Garage Floor Coating Cost in ${city}, ${state} | ${brand}`, `How much does garage floor coating cost in ${city}, ${state}? Transparent pricing per square foot and by garage size.`, "cost.html")}
<section class="hero"><div class="wrap"><h1>Garage Floor Coating Cost in ${city}, ${state}</h1><p>Transparent pricing — no surprises. See typical cost ranges for your garage size.</p><a class="btn" href="/#contact">Get My Exact Quote</a></div></section>
<section><div class="wrap"><h2>Typical Pricing</h2><div class="grid">
<div class="card"><h3>1-Car Garage</h3><p style="font-size:22px;font-weight:700;color:#0a0a0a">$1,200 – $2,200</p><p>~200–250 sq ft</p></div>
<div class="card"><h3>2-Car Garage</h3><p style="font-size:22px;font-weight:700;color:#0a0a0a">$2,000 – $3,800</p><p>~400–500 sq ft</p></div>
<div class="card"><h3>3-Car Garage</h3><p style="font-size:22px;font-weight:700;color:#0a0a0a">$3,000 – $5,500</p><p>~600–750 sq ft</p></div>
</div>
${seo?.cost_page_content ? `<p style="margin-top:24px;max-width:760px">${seo.cost_page_content}</p>` : ""}
</div></section>
${footer}`;

  const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: https://${domain}/sitemap.xml`;
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://${domain}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n  <url><loc>https://${domain}/cost.html</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n</urlset>`;
  const readme = `# ${brand}\n\nGarage floor coating lead-gen site for ${city}, ${state}.\n\n- Domain: https://${domain}\n- Phone: ${phone}\n\nAuto-provisioned by the Lead Gen Near You site factory.\n`;

  return {
    "index.html": indexHtml,
    "cost.html": costHtml,
    "robots.txt": robotsTxt,
    "sitemap.xml": sitemapXml,
    "README.md": readme,
  };
}

// ---- GitHub -----------------------------------------------------------------
export async function provisionGithub(base44, market, files) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection("github");
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "leadgennearyou-factory" };
  const repoName = `site-${market.slug || slugify(market.state + "-" + market.city)}`.slice(0, 40);

  let repo, owner;
  const createRes = await fetch("https://api.github.com/user/repos", { method: "POST", headers, body: JSON.stringify({ name: repoName, private: true, auto_init: true }) });
  if (createRes.ok) { repo = await createRes.json(); owner = repo.owner.login; }
  else if (createRes.status === 422) {
    // repo already exists — find it among the authenticated user's own repos
    const listRes = await fetch("https://api.github.com/user/repos?per_page=100&affiliation=owner", { headers });
    if (!listRes.ok) throw new Error(`GitHub list repos failed: ${listRes.status}`);
    const list = await listRes.json();
    repo = (list || []).find((r) => r.name === repoName);
    if (!repo) throw new Error(`GitHub repo "${repoName}" not found among your repos`);
    owner = repo.owner.login;
  } else throw new Error(`GitHub create repo failed: ${createRes.status} ${await createRes.text()}`);

  for (const [path, content] of Object.entries(files)) {
    const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${path}`, { headers });
    let sha;
    if (checkRes.ok) { const j = await checkRes.json(); sha = j.sha; }
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${path}`, {
      method: "PUT", headers, body: JSON.stringify({ message: `chore: ${sha ? "update" : "add"} ${path}`, content: b64(content), sha }),
    });
    if (!putRes.ok) throw new Error(`GitHub push ${path} failed: ${putRes.status} ${await putRes.text()}`);
  }
  return { repo: `${owner}/${repoName}`, repo_url: repo.html_url };
}

// ---- Google Drive ------------------------------------------------------------
export async function provisionDrive(base44, market) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
  const folderName = `${market.public_business_name || market.brand_name || "Market"} — ${market.city}, ${market.state}`;
  const res = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: folderName, mimeType: "application/vnd.google-apps.folder" }),
  });
  if (!res.ok) throw new Error(`Drive create folder failed: ${res.status} ${await res.text()}`);
  const folder = await res.json();
  return { folder_id: folder.id, folder_url: `https://drive.google.com/drive/folders/${folder.id}` };
}

// ---- Supabase ---------------------------------------------------------------
export async function provisionSupabase(market) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const org = process.env.SUPABASE_ORG_ID;
  if (!token || !org) throw new Error("Supabase secrets missing (SUPABASE_ACCESS_TOKEN / SUPABASE_ORG_ID)");
  const name = (market.slug || slugify(market.state + "-" + market.city)).replace(/[^a-z0-9]/g, "-").slice(0, 20);
  const dbPass = `Pass_${Math.random().toString(36).slice(2, 14)}!A1`;
  const res = await fetch("https://api.supabase.com/v1/projects", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, organization_id: org, db_pass: dbPass, region: "us-east-1", plan: "free" }),
  });
  if (!res.ok) throw new Error(`Supabase create project failed: ${res.status} ${await res.text()}`);
  const project = await res.json();
  return { project_id: project.id, project_url: `https://${project.ref || project.id}.supabase.co` };
}

// ---- Vercel -----------------------------------------------------------------
export async function provisionVercel(market, repoFullName) {
  const token = process.env.VERCEL_TOKEN;
  const team = process.env.VERCEL_TEAM_ID;
  if (!token) throw new Error("Vercel token missing (VERCEL_TOKEN)");
  const qs = team ? `?teamId=${team}` : "";
  const name = (market.slug || slugify(market.state + "-" + market.city)).replace(/[^a-z0-9-]/g, "-").slice(0, 40);

  let project;
  const createRes = await fetch(`https://api.vercel.com/v10/projects${qs}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, gitRepository: { type: "github", repo: repoFullName } }),
  });
  if (createRes.ok) project = await createRes.json();
  else if (createRes.status === 409) { const r = await fetch(`https://api.vercel.com/v9/projects/${name}${qs}`, { headers: { Authorization: `Bearer ${token}` } }); if (!r.ok) throw new Error(`Vercel project lookup failed: ${r.status}`); project = await r.json(); }
  else throw new Error(`Vercel create project failed: ${createRes.status} ${await createRes.text()}`);

  let url = `https://${name}.vercel.app`;
  try {
    const deployRes = await fetch(`https://api.vercel.com/v13/deployments${qs}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ gitSource: { type: "github", repo: repoFullName, ref: "main" }, target: "production", projectId: project.id }),
    });
    if (deployRes.ok) { const d = await deployRes.json(); if (d.url) url = `https://${d.url}`; }
  } catch (e) { /* deploy trigger optional — auto-deploy from repo link may handle it */ }

  return { project_id: project.id, url };
}