// Shared prompt builders + JSON schemas for the Brand Factory pipeline.

export function brandBriefSchema() {
  return {
    type: "object",
    properties: {
      business_name: { type: "string" },
      industry: { type: "string" },
      description: { type: "string" },
      audience: { type: "string" },
      vibe: { type: "string" },
      contact: {
        type: "object",
        properties: {
          phone: { type: "string" },
          email: { type: "string" },
          website: { type: "string" },
          address: { type: "string" }
        }
      }
    }
  };
}

export function strategySchema() {
  return {
    type: "object",
    properties: {
      positioning: { type: "string" },
      promise: { type: "string" },
      tagline: { type: "string" },
      voice: { type: "string" },
      colors: {
        type: "object",
        properties: {
          primary: { type: "string" },
          accent: { type: "string" },
          neutral: { type: "string" }
        }
      },
      typography: {
        type: "object",
        properties: {
          heading: { type: "string" },
          body: { type: "string" }
        }
      },
      logo_direction: { type: "string" }
    }
  };
}

export function brochureCopySchema() {
  return {
    type: "object",
    properties: {
      headline: { type: "string" },
      intro: { type: "string" },
      services: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" }
          }
        }
      },
      why_us: { type: "string" },
      cta: { type: "string" }
    }
  };
}

export function socialCaptionSchema() {
  return {
    type: "object",
    properties: {
      caption: { type: "string" },
      hashtags: { type: "array", items: { type: "string" } }
    }
  };
}

export function buildStrategyPrompt(p) {
  return `You are a senior brand strategist. Build a complete brand identity for this business.
Business name: ${p.business_name || "—"}
Industry: ${p.industry || "—"}
What they do: ${p.description || "—"}
Target audience: ${p.audience || "—"}
Desired vibe: ${p.vibe || "—"}
Return JSON with: positioning (one sharp sentence), promise (one sentence), tagline (short, memorable), voice (3-4 adjectives plus a one-line tone guide), colors (primary, accent, neutral as hex codes matching the vibe — high contrast, brandable), typography (heading font name, body font name — real Google Fonts), logo_direction (a detailed brief a logo designer can follow: concept, shapes, icon idea, layout).`;
}

export function buildLogoPrompt(p, style) {
  const s = p.strategy || {};
  return `Professional logo for "${p.business_name || ""}", ${p.industry || ""}.
Logo direction: ${s.logo_direction || "clean, modern, memorable"}.
Style: ${style}.
Vibe: ${p.vibe || "professional"}.
Flat vector logo, centered, on a plain solid white background, scalable, no photographic elements, no watermark, no mockup.`;
}

export function buildBusinessCardPrompt(p) {
  const s = p.strategy || {};
  return `Elegant business card design for "${p.business_name || ""}", ${p.industry || ""}.
Use brand colors: primary ${s.colors?.primary || "#111"}, accent ${s.colors?.accent || "#D4FF4D"}.
Tagline: ${s.tagline || ""}.
Front of card: business name + tagline + small logo mark, modern layout, lots of whitespace, print-ready flat design, top-down view on white.
No watermark.`;
}

export function buildBrochureCoverPrompt(p) {
  const s = p.strategy || {};
  return `Digital brochure cover for "${p.business_name || ""}", ${p.industry || ""}.
Headline: ${s.tagline || p.business_name || ""}.
Brand colors: ${s.colors?.primary || "#111"} and ${s.colors?.accent || "#D4FF4D"}.
Modern, premium, professional, clean layout, high-quality, no watermark, no mockup text other than the headline.`;
}

export function buildBrochureCopyPrompt(p) {
  return `Write brochure copy for "${p.business_name || ""}", a ${p.industry || ""} business.
What they do: ${p.description || ""}.
Audience: ${p.audience || ""}.
Brand voice: ${p.strategy?.voice || "professional and friendly"}.
Return JSON with: headline (short), intro (2-3 sentences), services (3-5 items each with title + 1-sentence description), why_us (one punchy sentence), cta (one sentence).`;
}

export function buildSocialPrompt(p, platform) {
  const s = p.strategy || {};
  return `Social media post image for ${platform} for "${p.business_name || ""}", ${p.industry || ""}.
Tagline: ${s.tagline || ""}.
Brand colors: ${s.colors?.primary || "#111"} and ${s.colors?.accent || "#D4FF4D"}.
Bold, scroll-stopping, professional, on-brand. No watermark. Square 1:1 composition.`;
}

export function buildSocialCaptionPrompt(p, platform) {
  return `Write an engaging ${platform} caption for "${p.business_name || ""}", a ${p.industry || ""} business.
What they do: ${p.description || ""}.
Brand voice: ${p.strategy?.voice || "professional and friendly"}.
Return JSON with: caption (1-3 sentences, with a hook and CTA), hashtags (5-8 relevant hashtags without the # symbol).`;
}

export function buildVideoPrompt(p) {
  const s = p.strategy || {};
  return `A short cinematic brand promo video for "${p.business_name || ""}", a ${p.industry || ""} business.
Mood: ${p.vibe || "professional, premium"}.
Tagline overlay feeling: "${s.tagline || ""}".
Brand colors: ${s.colors?.primary || "#111"} and ${s.colors?.accent || "#D4FF4D"}.
Smooth, elegant camera motion, polished product/service b-roll feel, warm professional lighting, ends on the brand name. No on-screen text.`;
}