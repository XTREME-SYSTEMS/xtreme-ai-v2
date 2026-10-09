import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { slugify, provisionGithub } from '../../shared/provisioning.ts';

// deployStrategicMindsSite — generates a self-contained static HTML site
// matching the Strategic Minds AI branding image (dark mode, neon blue,
// glowing AI core, 5 service modules, value props) and deploys it directly
// to Vercel as static files — NO build step needed, so no white screen.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const autobuild_id = body.autobuild_id;
    const brandingImage = body.branding_image || 'https://media.base44.com/images/public/6a79444e821211169a147eee/cdda5b891_ChatGPTImageOct8202612_30_16AM.png';

    const svc = base44.asServiceRole;
    let build = null;
    if (autobuild_id) {
      build = await svc.entities.AutoBuild.get(autobuild_id).catch(() => null);
    }

    const businessName = build?.business_name || 'Strategic Minds AI';
    const slug = slugify(businessName);

    // Generate the self-contained static HTML
    const html = generateStrategicMindsHTML(brandingImage);

    const files = {
      'index.html': html,
      'robots.txt': `User-agent: *\nAllow: /\n`,
      'README.md': `# ${businessName}\n\nSelf-contained static site deployed via the Auto Builder.\n`,
    };

    // Push to GitHub
    let githubRepo = '';
    try {
      const gh = await provisionGithub(base44, { slug, city: 'National', state: 'US', public_business_name: businessName }, files);
      githubRepo = gh.repo;
    } catch (e) {
      return Response.json({ error: `GitHub push failed: ${e.message}` }, { status: 500 });
    }

    // Deploy to Vercel as static files (no build step)
    const token = Deno.env.get('VERCEL_TOKEN');
    const team = Deno.env.get('VERCEL_TEAM_ID');
    if (!token) return Response.json({ error: 'VERCEL_TOKEN missing' }, { status: 500 });
    const qs = team ? `?teamId=${team}` : '';
    const name = slug.replace(/[^a-z0-9-]/g, '-').slice(0, 40);

    // Create a NEW project with a unique name — NOT git-linked, so the static
    // file deployment isn't overridden by a failing git build.
    const staticName = (slug + '-site').replace(/[^a-z0-9-]/g, '-').slice(0, 40);
    let project;
    const createRes = await fetch(`https://api.vercel.com/v10/projects${qs}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: staticName }),
    });
    if (createRes.ok) project = await createRes.json();
    else if (createRes.status === 409) {
      const r = await fetch(`https://api.vercel.com/v9/projects/${staticName}${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error(`Vercel project lookup failed: ${r.status}`);
      project = await r.json();
      // Remove any existing git link so static deploy isn't overridden
      try {
        await fetch(`https://api.vercel.com/v9/projects/${project.id}/link${qs}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      } catch {}
    } else throw new Error(`Vercel create project failed: ${createRes.status} ${await createRes.text()}`);

    // Disable SSO protection
    try {
      await fetch(`https://api.vercel.com/v9/projects/${project.id}${qs}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssoProtection: null }),
      });
    } catch {}

    // Deploy as static files — no build, immediate render
    function b64(s) { return btoa(unescape(encodeURIComponent(String(s)))); }
    const fileList = Object.entries(files).map(([path, content]) => ({ file: path, data: b64(content), encoding: 'base64' }));
    const deployRes = await fetch(`https://api.vercel.com/v13/deployments${qs}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: staticName, files: fileList, target: 'production', projectSettings: { framework: null } }),
    });
    if (!deployRes.ok) return Response.json({ error: `Vercel deploy failed: ${deployRes.status} ${await deployRes.text()}` }, { status: 500 });
    const deployment = await deployRes.json();
    const vercelUrl = deployment.url ? `https://${deployment.url}` : `https://${name}.vercel.app`;

    // Update AutoBuild record
    if (build) {
      await svc.entities.AutoBuild.update(autobuild_id, {
        deployment: { platform: 'vercel', live_url: vercelUrl, status: 'deployed', deployed_at: new Date().toISOString(), github_repo: githubRepo, deploy_method: 'static' },
        status: 'complete',
        current_step: 'complete',
      }).catch(() => {});
    }

    return Response.json({ ok: true, live_url: vercelUrl, github_repo: githubRepo, deploy_method: 'static' });
  } catch (error) {
    console.error('deployStrategicMindsSite error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function generateStrategicMindsHTML(brandingImage) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Strategic Minds AI | Custom AI Systems & Automation</title>
  <meta name="description" content="Custom AI Systems & Automation. Streamline Operations. Amplify Productivity. AI Agents, Workflow Automation, Chatbots, AI-Powered Websites, CRM & Lead Systems.">
  <meta property="og:title" content="Strategic Minds AI | Custom AI Systems & Automation">
  <meta property="og:description" content="Streamline Operations. Amplify Productivity.">
  <meta property="og:image" content="${brandingImage}">
  <meta property="og:type" content="website">
  <link rel="icon" href="${brandingImage}">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--bg:#0A0A0A;--blue:#007BFF;--cyan:#00E5FF;--glow:rgba(0,229,255,0.5);--text:#fff;--muted:rgba(255,255,255,0.6)}
    body{font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;line-height:1.6}
    a{text-decoration:none;color:inherit}

    /* Nav */
    nav{position:fixed;top:0;width:100%;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:16px 32px;background:rgba(10,10,10,0.85);backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,123,255,0.2)}
    .nav-logo{font-size:18px;font-weight:800;letter-spacing:-0.02em;background:linear-gradient(135deg,#fff,#00E5FF);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
    .nav-links{display:flex;gap:28px;align-items:center}
    .nav-links a{font-size:14px;color:var(--muted);transition:color 0.2s}
    .nav-links a:hover{color:var(--cyan)}
    .nav-cta{padding:9px 20px;border-radius:8px;background:linear-gradient(135deg,#007BFF,#00E5FF);color:#000;font-weight:700;font-size:14px;transition:transform 0.2s,box-shadow 0.2s}
    .nav-cta:hover{transform:translateY(-1px);box-shadow:0 0 20px var(--glow)}

    /* Hero */
    .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:100px 24px 60px;position:relative;overflow:hidden}
    .hero::before{content:'';position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(0,123,255,0.15),transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);z-index:0}
    .hero-tag{font-size:13px;font-weight:600;letter-spacing:0.3em;color:var(--cyan);text-transform:uppercase;margin-bottom:20px;position:relative;z-index:1}
    .hero h1{font-size:clamp(40px,7vw,88px);font-weight:900;letter-spacing:-0.03em;line-height:1.05;margin-bottom:20px;position:relative;z-index:1;text-shadow:0 0 60px rgba(0,229,255,0.3)}
    .hero h1 .gradient{background:linear-gradient(135deg,#007BFF,#00E5FF);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
    .hero p{font-size:clamp(14px,2vw,20px);color:var(--muted);letter-spacing:0.15em;text-transform:uppercase;font-weight:600;margin-bottom:40px;position:relative;z-index:1}
    .hero-cta{display:flex;gap:16px;flex-wrap:wrap;justify-content:center;position:relative;z-index:1}
    .btn-primary{padding:16px 36px;border-radius:10px;background:linear-gradient(135deg,#007BFF,#00E5FF);color:#000;font-weight:700;font-size:16px;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 0 30px rgba(0,123,255,0.4)}
    .btn-primary:hover{transform:translateY(-2px);box-shadow:0 0 40px var(--glow)}
    .btn-secondary{padding:16px 36px;border-radius:10px;border:1px solid rgba(0,229,255,0.3);color:var(--text);font-weight:600;font-size:16px;transition:border-color 0.2s,background 0.2s}
    .btn-secondary:hover{border-color:var(--cyan);background:rgba(0,229,255,0.05)}

    /* Core + Modules */
    .modules{padding:80px 24px;position:relative}
    .modules-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:1200px;margin:0 auto}
    .module-card{background:rgba(255,255,255,0.03);border:1px solid rgba(0,123,255,0.15);border-radius:16px;padding:36px 28px;transition:transform 0.3s,border-color 0.3s,box-shadow 0.3s;position:relative;overflow:hidden}
    .module-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--cyan),transparent);opacity:0;transition:opacity 0.3s}
    .module-card:hover{transform:translateY(-6px);border-color:rgba(0,229,255,0.4);box-shadow:0 20px 60px -20px rgba(0,123,255,0.3)}
    .module-card:hover::before{opacity:1}
    .module-icon{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;background:linear-gradient(135deg,rgba(0,123,255,0.15),rgba(0,229,255,0.1));border:1px solid rgba(0,229,255,0.2)}
    .module-icon svg{width:28px;height:28px;stroke:var(--cyan);fill:none;stroke-width:2}
    .module-card h3{font-size:20px;font-weight:700;margin-bottom:10px;letter-spacing:-0.01em}
    .module-card p{font-size:14px;color:var(--muted);line-height:1.5}

    /* Value Props */
    .value-props{padding:60px 24px;border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.3)}
    .value-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;max-width:1100px;margin:0 auto;text-align:center}
    .value-item{display:flex;flex-direction:column;align-items:center;gap:12px}
    .value-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(0,229,255,0.08);border:1px solid rgba(0,229,255,0.15)}
    .value-icon svg{width:24px;height:24px;stroke:var(--cyan);fill:none;stroke-width:2}
    .value-item span{font-size:15px;font-weight:600;letter-spacing:0.05em}

    /* CTA */
    .cta-section{padding:100px 24px;text-align:center;position:relative;overflow:hidden}
    .cta-section::before{content:'';position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(0,123,255,0.1),transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%)}
    .cta-section h2{font-size:clamp(28px,5vw,52px);font-weight:800;margin-bottom:16px;position:relative}
    .cta-section p{font-size:18px;color:var(--muted);margin-bottom:36px;position:relative}

    /* Footer */
    footer{padding:40px 24px;text-align:center;border-top:1px solid rgba(255,255,255,0.05)}
    footer p{font-size:14px;color:var(--muted)}

    @media(max-width:768px){.nav-links{display:none}.hero h1{font-size:42px}}
  </style>
</head>
<body>
  <nav>
    <span class="nav-logo">STRATEGIC MINDS AI</span>
    <div class="nav-links">
      <a href="#services">Services</a>
      <a href="#value">Why Us</a>
      <a href="#contact">Contact</a>
    </div>
    <a href="#contact" class="nav-cta">Get Started</a>
  </nav>

  <section class="hero">
    <div class="hero-tag">Strategic Minds AI</div>
    <h1>CUSTOM AI SYSTEMS<br><span class="gradient">&amp; AUTOMATION</span></h1>
    <p>Streamline Operations. Amplify Productivity.</p>
    <div class="hero-cta">
      <a href="#services" class="btn-primary">Explore Services</a>
      <a href="#contact" class="btn-secondary">Book a Consultation</a>
    </div>
  </section>

  <section class="modules" id="services">
    <div class="modules-grid">
      <div class="module-card">
        <div class="module-icon"><svg viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="12" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v1M8 14h.01M16 14h.01"/></svg></div>
        <h3>AI Agents</h3>
        <p>Autonomous AI that gets things done.</p>
      </div>
      <div class="module-card">
        <div class="module-icon"><svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="4"/><circle cx="16" cy="16" r="4"/><path d="M11 8h6M8 11v6"/></svg></div>
        <h3>Workflow Automation</h3>
        <p>Eliminate manual work. Scale faster.</p>
      </div>
      <div class="module-card">
        <div class="module-icon"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
        <h3>Chatbots</h3>
        <p>24/7 support. Real results.</p>
      </div>
      <div class="module-card">
        <div class="module-icon"><svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20M12 12a4 4 0 0 1 0 8M8 12h.01"/></svg></div>
        <h3>AI-Powered Websites</h3>
        <p>Modern sites that work smarter.</p>
      </div>
      <div class="module-card">
        <div class="module-icon"><svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="7"/><rect x="13" y="6" width="3" height="11"/><circle cx="18" cy="17" r="2"/></svg></div>
        <h3>CRM &amp; Lead Systems</h3>
        <p>Capture. Nurture. Convert.</p>
      </div>
    </div>
  </section>

  <section class="value-props" id="value">
    <div class="value-grid">
      <div class="value-item">
        <div class="value-icon"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9z"/></svg></div>
        <span>REDUCE COSTS</span>
      </div>
      <div class="value-item">
        <div class="value-icon"><svg viewBox="0 0 24 24"><path d="M3 3v18h18M7 14l4-4 4 4 6-6"/></svg></div>
        <span>BOOST PRODUCTIVITY</span>
      </div>
      <div class="value-item">
        <div class="value-icon"><svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3a4 4 0 0 1 0 8M21 21v-2a4 4 0 0 0-3-3.87"/></svg></div>
        <span>SCALE EFFORTLESSLY</span>
      </div>
      <div class="value-item">
        <div class="value-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>
        <span>FOCUS ON WHAT MATTERS</span>
      </div>
    </div>
  </section>

  <section class="cta-section" id="contact">
    <h2>Ready to Automate Your Business?</h2>
    <p>Get a custom AI system built for your operations.</p>
    <a href="mailto:hello@strategicminds.ai" class="btn-primary">Get Your Free Consultation</a>
  </section>

  <footer>
    <p>&copy; 2026 Strategic Minds AI. Custom AI Systems &amp; Automation.</p>
  </footer>
</body>
</html>`;
}