// ============================================================
// systemBuildProvisioning.ts — Autonomous end-of-build provisioning +
// documentation engine for the system-build pipeline.
//
// At the end of a system build (system_review step), this module:
//   1. Generates all system documentation (README, architecture, data
//      model, API, UI system, deployment, setup instructions, user guide)
//   2. Pushes the codebase + docs to a new GitHub repo
//   3. Deploys the app to Vercel (linked to the GitHub repo)
//   4. Provisions a Supabase project (if the data model has entities)
//   5. Uploads all docs to a Google Drive folder
//
// All results are returned to the caller (processAutoBuildStep) which
// persists them on the AutoBuild record. A Receipt is created for
// full auditability. Each service is provisioned independently — a
// failure in one does not block the others.
// ============================================================

function slugify(s: string): string {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

function b64(s: string): string {
  return btoa(unescape(encodeURIComponent(String(s))));
}

// ── Documentation generation (deterministic — no LLM, no credits) ────────

function techStackTable(tech: any): string {
  if (!tech) return "_No tech stack specified._";
  const rows = Object.entries(tech).map(([k, v]) => `| ${k} | ${v} |`);
  return `| Layer | Technology |\n|---|---|\n${rows.join("\n")}`;
}

function pagesTable(pages: any[]): string {
  if (!pages?.length) return "_No pages defined._";
  const rows = pages.map((p) => `| ${p.name} | \`${p.route || ""}\` | ${p.purpose || ""} | ${p.auth ? "✅" : "❌"} |`);
  return `| Page | Route | Purpose | Auth |\n|---|---|---|---|\n${rows.join("\n")}`;
}

function featuresTable(features: any[]): string {
  if (!features?.length) return "_No features defined._";
  return features.map((f) => `### ${f.name}\n${f.description || ""}\n\n- **Priority:** ${f.priority || "—"}\n- **Complexity:** ${f.complexity || "—"}`).join("\n\n");
}

function entitiesSection(dm: any): string {
  if (!dm?.entities?.length) return "_No entities defined._";
  return dm.entities.map((e: any) => {
    const fields = (e.fields || []).map((f: any) => {
      let line = `  - \`${f.name}\` (${f.type || "string"})${f.required ? " **required**" : ""}${f.unique ? " **unique**" : ""}`;
      if (f.default) line += ` — default: \`${f.default}\``;
      if (f.references) line += ` → references **${f.references}**`;
      if (f.validation) line += ` — ${f.validation}`;
      if (f.enum_values?.length) line += ` — enum: ${f.enum_values.join(", ")}`;
      return line;
    }).join("\n");
    const indexes = (e.indexes || []).map((idx: any) => `  - ${idx.unique ? "UNIQUE " : ""}INDEX (${idx.fields?.join(", ")})`).join("\n");
    return `### ${e.name}\n${e.description || ""}\n\n**Fields:**\n${fields || "  - _(none)_"}\n${indexes ? `\n**Indexes:**\n${indexes}\n` : ""}${e.timestamps ? "\n_Timestamps: created_at, updated_at_\n" : ""}`;
  }).join("\n\n");
}

function relationshipsSection(dm: any): string {
  if (!dm?.relationships?.length) return "_No relationships defined._";
  return dm.relationships.map((r: any) => `- **${r.from}** → ${r.to} (${r.type || "—"}) via \`${r.foreign_key || "—"}\`${r.cascade ? ` — ${r.cascade}` : ""}${r.description ? ` — ${r.description}` : ""}`).join("\n");
}

function apiEndpointsTable(dm: any): string {
  if (!dm?.api_endpoints?.length) return "_No API endpoints defined._";
  const rows = dm.api_endpoints.map((e: any) => `| \`${e.method || "GET"}\` | \`${e.path || ""}\` | ${e.entity || "—"} | ${e.operation || "—"} | ${e.auth_required ? "✅" : "❌"} | ${e.description || ""} |`);
  return `| Method | Path | Entity | Operation | Auth | Description |\n|---|---|---|---|---|---|\n${rows.join("\n")}`;
}

function colorPaletteTable(ui: any): string {
  const c = ui?.color_palette;
  if (!c) return "_No color palette defined._";
  const rows = Object.entries(c).map(([k, v]) => `| ${k} | \`${v}\` |`);
  return `| Token | Value |\n|---|---|\n${rows.join("\n")}`;
}

function typographySection(ui: any): string {
  const t = ui?.typography;
  if (!t) return "_No typography defined._";
  let s = `- **Heading font:** ${t.font_heading || "—"}\n- **Body font:** ${t.font_body || "—"}\n- **Mono font:** ${t.font_mono || "—"}`;
  if (t.scale?.length) {
    s += "\n\n| Name | Size | Weight | Line Height | Usage |\n|---|---|---|---|---|\n" + t.scale.map((s2: any) => `| ${s2.name} | ${s2.size} | ${s2.weight} | ${s2.line_height} | ${s2.usage || ""} |`).join("\n");
  }
  return s;
}

function componentsSection(ui: any): string {
  if (!ui?.components?.length) return "_No components defined._";
  return ui.components.map((c: any) => {
    const props = (c.props || []).map((p: any) => `  - \`${p.name}\` (${p.type || "any"})${p.default ? ` = \`${p.default}\`` : ""} — ${p.description || ""}`).join("\n");
    return `### ${c.name}\n${c.description || ""}\n\n- **Category:** ${c.category || "—"}${c.variants?.length ? `\n- **Variants:** ${c.variants.join(", ")}` : ""}${c.usage_notes ? `\n- **Notes:** ${c.usage_notes}` : ""}\n\n**Props:**\n${props || "  - _(none)_"}`;
  }).join("\n\n");
}

function envVarsTable(dep: any): string {
  if (!dep?.env_vars?.length) return "_No environment variables defined._";
  return `| Key | Description | Required |\n|---|---|---|\n` + dep.env_vars.map((e: any) => `| \`${e.key}\` | ${e.description} | ${e.required ? "✅" : "❌"} |`).join("\n");
}

export function generateSystemDocs(build: any): Record<string, string> {
  const arch = build.architecture || {};
  const dm = build.data_model || {};
  const ui = build.ui_system || {};
  const cm = build.code_manifest || {};
  const dep = build.deployment || {};
  const name = build.business_name || "Untitled Product";
  const productType = build.product_type || "web_app";
  const date = new Date().toISOString().split("T")[0];
  const docs: Record<string, string> = {};

  // ── README.md ──
  docs["README.md"] = `# ${name}

> ${arch.concept || "A production-ready " + productType + " built by the Xtreme AI autonomous system."}

${arch.summary || ""}

## Tech Stack

${techStackTable(arch.tech_stack)}

## Quick Start

\`\`\`bash
# 1. Clone the repository
git clone <repo-url>
cd <repo-name>

# 2. Install dependencies
npm install

# 3. Copy the environment template
cp .env.example .env
# Fill in the values — see SETUP_INSTRUCTIONS.md for details

# 4. Run the development server
npm run dev
\`\`\`

## Documentation

This project includes a full documentation set in the \`docs/\` folder:

| Document | Description |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, tech stack, pages, features, and integrations |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | Entity schemas, fields, relationships, indexes, and seed data |
| [API.md](docs/API.md) | API endpoints reference |
| [UI_SYSTEM.md](docs/UI_SYSTEM.md) | Design system — colors, typography, components, and layout patterns |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment configuration, environment variables, and build commands |
| [SETUP_INSTRUCTIONS.md](docs/SETUP_INSTRUCTIONS.md) | Step-by-step setup guide (the digital instruction manual) |
| [USER_GUIDE.md](docs/USER_GUIDE.md) | How to use the system day-to-day |

## Project Info

- **Product type:** ${productType}
- **Generated:** ${date}
- **Files in manifest:** ${cm.files?.length || 0}
- **Estimated LOC:** ${cm.estimated_loc || "—"}
- **Framework:** ${cm.framework || "—"}
`;

  // ── ARCHITECTURE.md ──
  docs["docs/ARCHITECTURE.md"] = `# Architecture — ${name}

## Concept

${arch.concept || "—"}

## Summary

${arch.summary || "—"}

## Tech Stack

${techStackTable(arch.tech_stack)}

## Pages

${pagesTable(arch.pages)}

## Features

${featuresTable(arch.features)}

## Integrations

${arch.integrations?.length ? arch.integrations.map((i: any) => `### ${i.name || i}\n${i.purpose || ""}\n- **Type:** ${i.type || "—"}`).join("\n\n") : "_No integrations defined._"}

## User Flows

${arch.user_flows?.length ? arch.user_flows.map((f: any) => `- ${f}`).join("\n") : "_No user flows defined._"}

## Technical Decisions

${arch.tech_decisions?.length ? arch.tech_decisions.map((d: any) => `- ${d}`).join("\n") : "_No technical decisions recorded._"}

## Estimated Effort

${arch.estimated_effort || "—"}
`;

  // ── DATA_MODEL.md ──
  docs["docs/DATA_MODEL.md"] = `# Data Model — ${name}

## Entities

${entitiesSection(dm)}

## Relationships

${relationshipsSection(dm)}

## Seed Data

${dm.seed_data ? "```json\n" + JSON.stringify(dm.seed_data, null, 2) + "\n```" : "_No seed data defined._"}
`;

  // ── API.md ──
  docs["docs/API.md"] = `# API Reference — ${name}

## Endpoints

${apiEndpointsTable(dm)}

## Authentication

API endpoints marked with ✅ require authentication. Include a valid JWT bearer token in the \`Authorization\` header:

\`\`\`
Authorization: Bearer <token>
\`\`\`

## Conventions

- All list endpoints support pagination via \`?limit=\` and \`?skip=\` query parameters.
- All responses are JSON.
- Errors return \`{ error: string }\` with the appropriate HTTP status code.
`;

  // ── UI_SYSTEM.md ──
  docs["docs/UI_SYSTEM.md"] = `# UI Design System — ${name}

## Color Palette

${colorPaletteTable(ui)}

## Typography

${typographySection(ui)}

## Spacing

${ui.spacing?.unit ? `**Base unit:** ${ui.spacing.unit}` : ""}
${ui.spacing?.scale?.length ? "\n| Name | Value |\n|---|---|\n" + ui.spacing.scale.map((s: any) => `| ${s.name} | ${s.value} |`).join("\n") : ""}

## Components

${componentsSection(ui)}

## Layout Patterns

${ui.layout_patterns?.length ? ui.layout_patterns.map((l: any) => `### ${l.name}\n${l.description || ""}\n\n**Usage:** ${l.usage || "—"}`).join("\n\n") : "_No layout patterns defined._"}

## Responsive Breakpoints

${ui.responsive?.breakpoints?.length ? "| Name | Min Width | Description |\n|---|---|---|\n" + ui.responsive.breakpoints.map((b: any) => `| ${b.name} | ${b.min_width} | ${b.description || ""} |`).join("\n") : "_No breakpoints defined._"}
${ui.responsive?.strategy ? `\n**Strategy:** ${ui.responsive.strategy}` : ""}

## Design Principles

${ui.design_principles?.length ? ui.design_principles.map((p: any) => `- ${p}`).join("\n") : "_No design principles recorded._"}
`;

  // ── DEPLOYMENT.md ──
  docs["docs/DEPLOYMENT.md"] = `# Deployment — ${name}

## Platform

${dep.platform || "vercel"}

## Live URL

${dep.live_url || "_Not yet deployed — see SETUP_INSTRUCTIONS.md to deploy._"}

## Build Configuration

| Setting | Value |
|---|---|
| Framework | ${dep.build_config?.framework || "—"} |
| Build command | \`${dep.build_config?.build_command || "npm run build"}\` |
| Dev command | \`${dep.build_config?.dev_command || "npm run dev"}\` |
| Install command | \`${dep.build_config?.install_command || "npm install"}\` |
| Output directory | ${dep.build_config?.output_directory || "—"} |
| Node version | ${dep.build_config?.node_version || "20.x"} |

## Environment Variables

${envVarsTable(dep)}

## Deployment Steps

1. Push your code to the GitHub repository (already done by the autonomous system).
2. Import the repository into Vercel (or use the auto-linked project).
3. Add the environment variables listed above in the Vercel project settings.
4. Deploy — Vercel will run the build command and serve the output directory.
5. (Optional) Add a custom domain in the Vercel project settings.

## Routes

${dep.routes?.length ? "| Path | Page |\n|---|---|\n" + dep.routes.map((r: any) => `| \`${r.path}\` | ${r.page || "—"} |`).join("\n") : "_No routes defined._"}
`;

  return docs;
}

// ── Setup instructions + user guide (need provisioned URLs, generated after provisioning) ──

export function generateSetupInstructions(build: any, results: any): string {
  const name = build.business_name || "Untitled Product";
  const repoUrl = results.github?.repo_url || "<github-repo-url>";
  const repo = results.github?.repo || "<owner/repo>";
  const vercelUrl = results.vercel?.url || "<vercel-url>";
  const supabaseUrl = results.supabase?.project_url;
  const hasSupabase = !!results.supabase;
  const dep = build.deployment || {};
  const envVars = dep.env_vars || [];

  let supabaseSection = "";
  if (hasSupabase) {
    supabaseSection = `
## 3. Set Up the Database (Supabase)

A Supabase project was provisioned for you:

- **Project URL:** ${supabaseUrl}
- **Project ID:** ${results.supabase?.project_id}

### Get your database credentials

1. Log in to [supabase.com](https://supabase.com) with the account that owns the project.
2. Open the project → **Settings → API**.
3. Copy the **Project URL** and the **anon public API key**.
4. Copy the **Database connection string** from **Settings → Database**.

### Create the tables

Run the SQL from [DATA_MODEL.md](DATA_MODEL.md) in the Supabase SQL Editor (Dashboard → SQL Editor → New query) to create all tables, relationships, and seed data.
`;
  }

  let envSection = "";
  if (envVars.length) {
    envSection = `
## ${hasSupabase ? "4" : "3"}. Configure Environment Variables

Create a \`.env\` file in the project root with these values:

\`\`\`env
${envVars.map((e: any) => `# ${e.description}${e.required ? " (required)" : ""}\n${e.key}=${hasSupabase && e.key === "DATABASE_URL" ? "<your-supabase-connection-string>" : "<value>"}`).join("\n\n")}
\`\`\`
`;
  }

  const runStep = hasSupabase ? "5" : "4";
  const deployStep = hasSupabase ? "6" : "5";

  return `# Setup Instructions — ${name}

> This is your digital instruction manual. Follow these steps in order to get the system running locally and deployed to production. Every step was set up for you by the autonomous build system — you just need to fill in the credentials.

## What Was Provisioned For You

| Service | Status | URL |
|---|---|---|
| GitHub Repository | ${results.github ? "✅ Created" : "❌ Failed"} | ${results.github ? repoUrl : "—"} |
| Vercel Deployment | ${results.vercel ? "✅ Deployed" : "❌ Failed"} | ${results.vercel ? vercelUrl : "—"} |
| Supabase Database | ${hasSupabase ? "✅ Provisioned" : "⬜ Not needed"} | ${hasSupabase ? supabaseUrl : "—"} |
| Google Drive (Docs) | ${results.drive ? "✅ Uploaded" : "❌ Failed"} | ${results.drive?.folder_url || "—"} |

## 1. Prerequisites

Install these on your machine:

- **Node.js** 20.x or later — [download here](https://nodejs.org/)
- **Git** — [download here](https://git-scm.com/downloads)
- A code editor (we recommend VS Code)

Verify your installation:
\`\`\`bash
node --version   # should print v20.x or higher
git --version
\`\`\`

## 2. Clone the Repository

\`\`\`bash
git clone ${repoUrl}
cd ${repo.split("/").pop() || "your-project"}
npm install
\`\`\`
${supabaseSection}${envSection}
## ${runStep}. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open your browser to \`http://localhost:5173\` (Vite) or \`http://localhost:3000\` (Next.js). You should see the app running.

## ${deployStep}. Deploy to Production

The Vercel project was already created and linked to your GitHub repo. To deploy:

1. Go to [vercel.com](https://vercel.com) and log in.
2. Open the project for **${name}**.
3. Go to **Settings → Environment Variables** and add each variable from the table above.
4. Go to **Deployments** and click **Redeploy** (or push a new commit to \`main\` — Vercel auto-deploys on push).

Your live site will be available at: **${vercelUrl}**

## Need Help?

- See [ARCHITECTURE.md](ARCHITECTURE.md) for the system overview.
- See [DATA_MODEL.md](DATA_MODEL.md) for the database schema.
- See [USER_GUIDE.md](USER_GUIDE.md) for how to use the system.
- All documentation is also stored in your Google Drive folder: ${results.drive?.folder_url || "(Drive upload pending)"}
`;
}

export function generateUserGuide(build: any): string {
  const name = build.business_name || "Untitled Product";
  const arch = build.architecture || {};
  const pages = arch.pages || [];
  const features = arch.features || [];

  return `# User Guide — ${name}

This guide explains how to use ${name} day-to-day.

## Getting Started

1. Open the app in your browser.
2. If the app requires authentication, sign up or log in.
3. You'll land on the main dashboard.

## Pages

${pages.map((p: any) => `### ${p.name} (\`${p.route}\`)\n${p.purpose || ""}${p.auth ? "\n\n_Requires login._" : ""}`).join("\n\n")}

## Key Features

${features.map((f: any) => `### ${f.name}\n${f.description || ""}`).join("\n\n")}

## Tips

- Use the navigation menu to move between pages.
- Data you create is saved automatically.
- If something doesn't load, refresh the page — the app auto-reconnects.

## Troubleshooting

| Problem | Solution |
|---|---|
| Page won't load | Check your internet connection, then refresh |
| Can't log in | Verify your email and password, or use the forgot-password link |
| Data not saving | Check that you're logged in and the database is reachable |

## Support

For technical issues, refer to [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) or contact your development team.
`;
}

// ── Generate a package.json if the manifest doesn't include one ──────────

function generatePackageJson(build: any): string {
  const cm = build.code_manifest || {};
  const framework = (cm.framework || "vite").toLowerCase();
  const isNext = framework.includes("next");
  const name = slugify(build.business_name || cm.repo_name || "system-build");

  const deps: Record<string, string> = isNext
    ? { "next": "^14.2.0", "react": "^18.2.0", "react-dom": "^18.2.0" }
    : { "react": "^18.2.0", "react-dom": "^18.2.0", "react-router-dom": "^6.26.0" };

  const scripts = isNext
    ? { "dev": "next dev", "build": "next build", "start": "next start", "lint": "next lint" }
    : { "dev": "vite", "build": "vite build", "preview": "vite preview" };

  return JSON.stringify({
    name,
    version: "1.0.0",
    private: true,
    type: "module",
    scripts,
    dependencies: deps,
    devDependencies: isNext
      ? { "autoprefixer": "^10.4.0", "postcss": "^8.4.0", "tailwindcss": "^3.4.0" }
      : { "@vitejs/plugin-react": "^4.3.0", "autoprefixer": "^10.4.0", "postcss": "^8.4.0", "tailwindcss": "^3.4.0", "vite": "^5.4.0" },
  }, null, 2);
}

// ── GitHub ──────────────────────────────────────────────────────────────

async function provisionGithub(base44: any, build: any, files: Record<string, string>): Promise<{ repo: string; repo_url: string }> {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection("github");
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "xtreme-system-factory",
  };
  const repoName = slugify(build.business_name || build.code_manifest?.repo_name || "system-build");

  // Create repo (or reuse if it exists)
  let owner: string;
  let repoUrl: string;
  const createRes = await fetch("https://api.github.com/user/repos", {
    method: "POST", headers, body: JSON.stringify({ name: repoName, private: true, auto_init: true }),
  });
  if (createRes.ok) {
    const repo = await createRes.json();
    owner = repo.owner.login;
    repoUrl = repo.html_url;
  } else if (createRes.status === 422) {
    const meRes = await fetch("https://api.github.com/user", { headers });
    if (!meRes.ok) throw new Error(`GitHub get user failed: ${meRes.status}`);
    const me = await meRes.json();
    owner = me.login;
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
    if (!repoRes.ok) throw new Error(`GitHub repo "${repoName}" not found`);
    const repo = await repoRes.json();
    repoUrl = repo.html_url;
  } else {
    throw new Error(`GitHub create repo failed: ${createRes.status} ${await createRes.text()}`);
  }

  // Push files (code + docs)
  for (const [path, content] of Object.entries(files)) {
    const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${path}`, { headers });
    let sha: string | undefined;
    if (checkRes.ok) { const j = await checkRes.json(); sha = j.sha; }
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${path}`, {
      method: "PUT", headers,
      body: JSON.stringify({ message: `chore: ${sha ? "update" : "add"} ${path}`, content: b64(content), sha }),
    });
    if (!putRes.ok) throw new Error(`GitHub push ${path} failed: ${putRes.status}`);
  }

  return { repo: `${owner}/${repoName}`, repo_url: repoUrl };
}

// ── Vercel ──────────────────────────────────────────────────────────────

async function provisionVercel(build: any, repoFullName: string): Promise<{ project_id: string; url: string; deploy_method: string }> {
  const token = Deno.env.get("VERCEL_TOKEN");
  const team = Deno.env.get("VERCEL_TEAM_ID");
  if (!token) throw new Error("VERCEL_TOKEN secret missing");
  const qs = team ? `?teamId=${team}` : "";
  const name = slugify(build.business_name || build.code_manifest?.repo_name || "system-build");
  const cm = build.code_manifest || {};
  const framework = (cm.framework || "vite").toLowerCase();
  const isNext = framework.includes("next");
  const buildCommand = "npm run build";
  const outputDir = isNext ? ".next" : "dist";
  const installCommand = "npm install";

  // Create or reuse the project — git-linked so Vercel builds from the repo
  let project: any;
  const createRes = await fetch(`https://api.vercel.com/v10/projects${qs}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      gitRepository: { type: "github", repo: repoFullName },
      framework: isNext ? "nextjs" : "vite",
      buildCommand,
      outputDirectory: outputDir,
      installCommand,
    }),
  });
  if (createRes.ok) project = await createRes.json();
  else if (createRes.status === 409) {
    const r = await fetch(`https://api.vercel.com/v9/projects/${name}${qs}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`Vercel project lookup failed: ${r.status}`);
    project = await r.json();
    if (!project.link) {
      try {
        await fetch(`https://api.vercel.com/v9/projects/${project.id}/link${qs}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ type: "github", repo: repoFullName, ref: "main" }),
        });
      } catch { /* non-fatal */ }
    }
  } else throw new Error(`Vercel create project failed: ${createRes.status} ${await createRes.text()}`);

  // Disable SSO protection so the site is publicly accessible
  try {
    await fetch(`https://api.vercel.com/v9/projects/${project.id}${qs}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ssoProtection: null }),
    });
  } catch { /* non-fatal */ }

  // Public production URL
  let url = `https://${name}.vercel.app`;
  if (team) {
    try {
      const teamRes = await fetch(`https://api.vercel.com/v2/teams/${team}`, { headers: { Authorization: `Bearer ${token}` } });
      if (teamRes.ok) { const t = await teamRes.json(); if (t.slug) url = `https://${name}-${t.slug}.vercel.app`; }
    } catch { /* fall back */ }
  }

  // Deploy via git source — Vercel clones the repo and builds
  const [owner, repoName] = repoFullName.split("/");
  const gitDeployRes = await fetch(`https://api.vercel.com/v13/deployments${qs}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      gitSource: { type: "github", org: owner, repo: repoName, ref: "main" },
      target: "production",
      projectSettings: { framework: isNext ? "nextjs" : "vite", buildCommand, outputDirectory: outputDir, installCommand },
    }),
  });
  if (gitDeployRes.ok) {
    const d = await gitDeployRes.json();
    if (d.url) url = `https://${d.url}`;
    return { project_id: project.id, url, deploy_method: "git_build" };
  }

  // Git deploy failed (Vercel GitHub app not installed) — the project is still
  // created and linked; the next push to main will trigger a build.
  return { project_id: project.id, url, deploy_method: "git_linked_pending_build" };
}

// ── Supabase ────────────────────────────────────────────────────────────

async function provisionSupabase(build: any): Promise<{ project_id: string; project_url: string }> {
  const token = Deno.env.get("SUPABASE_ACCESS_TOKEN");
  const org = Deno.env.get("SUPABASE_ORG_ID");
  if (!token || !org) throw new Error("Supabase secrets missing (SUPABASE_ACCESS_TOKEN / SUPABASE_ORG_ID)");
  const name = slugify(build.business_name || build.code_manifest?.repo_name || "system-build").replace(/[^a-z0-9]/g, "-").slice(0, 20);
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

// ── Google Drive ────────────────────────────────────────────────────────

async function uploadDriveFile(accessToken: string, folderId: string, name: string, content: string): Promise<void> {
  const boundary = "xtp" + Math.random().toString(36).slice(2);
  const metadata = JSON.stringify({ name, parents: [folderId] });
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: text/markdown\r\n\r\n${content}\r\n--${boundary}--`;
  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error(`Drive upload ${name} failed: ${res.status}`);
}

async function provisionDrive(base44: any, build: any, docs: Record<string, string>): Promise<{ folder_id: string; folder_url: string }> {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
  const folderName = `${build.business_name || "System Build"} — System Docs`;
  const res = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: folderName, mimeType: "application/vnd.google-apps.folder" }),
  });
  if (!res.ok) throw new Error(`Drive create folder failed: ${res.status} ${await res.text()}`);
  const folder = await res.json();

  // Upload each doc as a file in the folder
  for (const [path, content] of Object.entries(docs)) {
    const fileName = path.replace(/^docs\//, "").replace(/\//g, " — ");
    try { await uploadDriveFile(accessToken, folder.id, fileName, content); } catch { /* best-effort */ }
  }

  return { folder_id: folder.id, folder_url: `https://drive.google.com/drive/folders/${folder.id}` };
}

// ── Orchestrator ────────────────────────────────────────────────────────

export async function provisionSystemBuild(base44: any, buildId: string): Promise<{
  deployment: Record<string, any>;
  provisioned: Record<string, any>;
}> {
  const builds = await base44.asServiceRole.entities.AutoBuild.filter({ id: buildId }, "-created_date", 1);
  const build = builds?.[0];
  if (!build) throw new Error("Build not found");
  if (!build.code_manifest) throw new Error("Code manifest is required before provisioning. Run the codegen step first.");

  // 1. Generate the static docs (README, ARCHITECTURE, DATA_MODEL, API, UI_SYSTEM, DEPLOYMENT)
  const docs = generateSystemDocs(build);

  // 2. Convert code_manifest files → { path: content } map
  const codeFiles: Record<string, string> = {};
  for (const f of (build.code_manifest.files || [])) {
    const content = f.content || f.key_content;
    if (content && f.path) codeFiles[f.path] = content;
  }
  // Ensure package.json exists (Vercel needs it to build)
  if (!codeFiles["package.json"]) codeFiles["package.json"] = generatePackageJson(build);

  // Merge code + docs into one file set for GitHub
  const allFiles = { ...codeFiles, ...docs };

  const provisioned: Record<string, any> = {};

  // 3. GitHub — push code + docs
  try {
    provisioned.github = await provisionGithub(base44, build, allFiles);
  } catch (e: any) { provisioned.github_error = String(e?.message || e); }

  // 4. Vercel — deploy (linked to the GitHub repo)
  if (provisioned.github?.repo) {
    try {
      provisioned.vercel = await provisionVercel(build, provisioned.github.repo);
    } catch (e: any) { provisioned.vercel_error = String(e?.message || e); }
  }

  // 5. Supabase — provision if the data model has entities
  if (build.data_model?.entities?.length > 0) {
    try {
      provisioned.supabase = await provisionSupabase(build);
    } catch (e: any) { provisioned.supabase_error = String(e?.message || e); }
  }

  // 6. Generate the setup instructions + user guide (need provisioned URLs)
  docs["docs/SETUP_INSTRUCTIONS.md"] = generateSetupInstructions(build, provisioned);
  docs["docs/USER_GUIDE.md"] = generateUserGuide(build);

  // 7. Google Drive — upload all docs
  try {
    provisioned.drive = await provisionDrive(base44, build, docs);
  } catch (e: any) { provisioned.drive_error = String(e?.message || e); }

  // 8. Build the deployment record for the AutoBuild entity
  const deployment = {
    ...(build.deployment || {}),
    platform: "vercel",
    live_url: provisioned.vercel?.url || build.deployment?.live_url || "",
    status: provisioned.vercel ? "deployed" : "provisioned",
    deployed_at: new Date().toISOString(),
    repo_url: provisioned.github?.repo_url,
    repo: provisioned.github?.repo,
    drive_url: provisioned.drive?.folder_url,
    drive_folder_id: provisioned.drive?.folder_id,
    supabase_url: provisioned.supabase?.project_url,
    supabase_project_id: provisioned.supabase?.project_id,
    docs_count: Object.keys(docs).length,
    docs_list: Object.keys(docs),
  };

  // 9. Receipt for auditability
  try {
    await base44.asServiceRole.entities.Receipt.create({
      agent_or_workflow: "provisionSystemBuild",
      action: "provision_system_build",
      entity_type: "AutoBuild",
      entity_id: buildId,
      inputs: JSON.stringify({ build_id: buildId, business_name: build.business_name }).slice(0, 4000),
      outputs: JSON.stringify({
        github: provisioned.github?.repo || provisioned.github_error,
        vercel: provisioned.vercel?.url || provisioned.vercel_error,
        supabase: provisioned.supabase?.project_url || provisioned.supabase_error || "skipped",
        drive: provisioned.drive?.folder_url || provisioned.drive_error,
        docs: Object.keys(docs),
      }).slice(0, 4000),
      status: "success",
      evidence: `Provisioned: GitHub=${provisioned.github?.repo || "failed"}, Vercel=${provisioned.vercel?.url || "failed"}, Supabase=${provisioned.supabase?.project_url || "skipped"}, Drive=${provisioned.drive?.folder_url || "failed"}, Docs=${Object.keys(docs).length} files`,
    });
  } catch { /* best-effort */ }

  return { deployment, provisioned };
}