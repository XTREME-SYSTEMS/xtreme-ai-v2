import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Generates rich, location-aware website copy for a client's epoxy site using
// real web context about their area. Fed into the Website Design Studio so
// every layout preview shows the actual content the client will get — no
// ambiguity at approval time.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const {
      businessName, services, serviceArea, city, state,
      differentiators, yearsInBusiness, phone, email,
    } = body;

    const biz = businessName || "your epoxy business";
    const loc = [city, state].filter(Boolean).join(", ").trim() || (serviceArea || "your area");
    const svc = Array.isArray(services) && services.length
      ? services.join(", ")
      : "epoxy flooring, polished concrete, concrete coatings";
    const area = serviceArea || loc;
    const diff = Array.isArray(differentiators) && differentiators.length
      ? differentiators.join("; ")
      : "";

    const prompt = `You are writing the website copy for a local epoxy contractor. Make it specific, high-converting, and locally relevant — no generic filler.

Business name: ${biz}
Primary location: ${loc}
Service area: ${area}
Services offered: ${svc}
Years in business: ${yearsInBusiness || "n/a"}
Differentiators: ${diff || "n/a"}
Phone: ${phone || "n/a"}
Email: ${email || "n/a"}

Using real, current information about ${loc} (the real surrounding cities/communities, local landmarks, climate, and common residential/commercial concrete needs there), write website copy that feels native to ${loc}. Reference the actual area and local trust signals where natural.

Return JSON with exactly these fields:
- heroHeadline: punchy headline (mention the core service + location)
- heroSubhead: 1-2 sentence subhead
- aboutTitle: about section heading
- aboutBody: 2-4 sentence about paragraph referencing local experience
- services: array of 5-7 objects { title, description } (description 1-2 sentences each)
- faq: array of 6-8 objects { question, answer } (locally relevant, answer 1-2 sentences)
- localArea: 1 paragraph about the service area / nearby communities
- cta: short call-to-action phrase
- metaTitle: <=60 chars
- metaDescription: <=160 chars`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_1_pro",
      response_json_schema: {
        type: "object",
        properties: {
          heroHeadline: { type: "string" },
          heroSubhead: { type: "string" },
          aboutTitle: { type: "string" },
          aboutBody: { type: "string" },
          services: {
            type: "array",
            items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } },
          },
          faq: {
            type: "array",
            items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } },
          },
          localArea: { type: "string" },
          cta: { type: "string" },
          metaTitle: { type: "string" },
          metaDescription: { type: "string" },
        },
      },
    });

    // Web-search context can leak citation links into the copy as raw
    // markdown "[text](url)" or bare urls. Strip them so the site text is clean.
    const clean = (v) => {
      if (typeof v === "string") {
        return v
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .replace(/https?:\/\/[^\s)]+/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();
      }
      if (Array.isArray(v)) return v.map(clean);
      if (v && typeof v === "object") {
        const o = {};
        for (const k of Object.keys(v)) o[k] = clean(v[k]);
        return o;
      }
      return v;
    };
    const content = clean(res);

    return Response.json({ ok: true, content });
  } catch (error) {
    console.error("generateWebsiteContent error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}