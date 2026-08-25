import { UNIVERSAL_PIPELINE } from "@/lib/universalPipeline";

// Step-specific conversation guides for the client assistant.
// Each step gets:
//  - `focus`: a one-line description of what this step is about (for the AI)
//  - `questions`: specific, ordered questions the assistant should ask the
//    user — ONE at a time — pertaining only to this step
//  - `nextSteps`: a short explanation of what happens after this step, so the
//    user always knows what's coming
//  - `opener`: the very first message the assistant shows for this step
//
// This keeps the chat focused on the step the user is actually on, instead of
// being an open-ended "ask me anything" box.
export const STEP_GUIDES = {
  onboarding: {
    focus: "capturing the client's core epoxy/concrete business details so the team can start work",
    questions: [
      "What's your epoxy/concrete business name (and website, if you have one)?",
      "Which epoxy/concrete niche are you in — epoxy flooring, coatings, polished concrete, or decorative concrete?",
      "What specific services do you offer — garage epoxy, metallic floors, polished concrete, stamped concrete, overlays?",
      "Which cities or areas do you serve for epoxy/concrete projects?",
      "What's the best phone number and email for customers to reach you?",
      "What makes your epoxy/concrete business different from local competitors?",
    ],
    nextSteps:
      "Once I have your details, your team reviews them and prepares your tailored Strategy & Proposal — you'll approve that before we build anything.",
    opener:
      "Let's get your epoxy/concrete business basics down so your team can start. I'll ask a few quick questions — one at a time.",
  },
  strategy: {
    focus: "confirming the client's epoxy/concrete business goals so the team can prepare the right strategy & proposal",
    questions: [
      "What's your #1 goal right now — more epoxy/concrete leads, higher local rankings, or a stronger brand?",
      "Roughly how many new epoxy/concrete jobs per month would make this a win for you?",
      "Are there epoxy/concrete competitors you admire or want to out-rank?",
      "Any special offers — free estimates, seasonal epoxy specials, commercial concrete discounts?",
    ],
    nextSteps:
      "After you approve the strategy, we move into your Brand Kit — logo, colors, business card, brochure and social posts.",
    opener:
      "Your team is preparing your epoxy/concrete strategy & proposal. While they work, let me ask a few questions to make sure the plan fits your goals.",
  },
  "brand-kit": {
    focus: "gathering brand preferences before the team generates the epoxy/concrete brand kit",
    questions: [
      "What's the vibe you want for your epoxy/concrete brand — modern, bold, industrial, premium, minimal?",
      "Any colors you love (or ones to avoid)? Metallic epoxy brands often use bold accents.",
      "Do you have an existing logo, or are we starting from scratch?",
      "Got a tagline in mind, or want us to suggest a few epoxy/concrete taglines?",
      "Any fonts or styles you're drawn to?",
    ],
    nextSteps:
      "Once you approve the brand kit, we move into your Website Build — design, copy and development.",
    opener:
      "Before we build your epoxy/concrete brand kit, let me nail down your style preferences so the first round is on target.",
  },
  website: {
    focus: "confirming epoxy/concrete website scope and must-haves before the team builds the site",
    questions: [
      "Which pages do you need — Home, About, Services (epoxy, polished concrete, decorative), Gallery, Contact, FAQ?",
      "Any must-have features — quote form, project gallery, before/after slider, financing?",
      "Are there epoxy/concrete websites you like the look of?",
      "Do you have project photos ready, or should we generate epoxy/concrete imagery?",
    ],
    nextSteps:
      "After you approve the site, we optimize it for SEO & AEO (on-page, schema, AI-search) targeting epoxy/concrete keywords.",
    opener:
      "Let's scope your epoxy/concrete website so the build matches what you need. A few quick questions:",
  },
  "seo-aeo": {
    focus: "confirming epoxy/concrete SEO targets before the team optimizes the site",
    questions: [
      "What are the top epoxy/concrete keywords you want to show up for — 'epoxy flooring near me', 'polished concrete [city]'?",
      "Which cities or neighborhoods matter most to you for epoxy/concrete jobs?",
      "Do you already have a Google Business Profile set up for your epoxy/concrete business?",
      "Any epoxy/concrete competitors consistently showing up above you in search?",
    ],
    nextSteps:
      "After approval, we deploy your site to your live domain (Launch).",
    opener:
      "Before we optimize for search, let me confirm your epoxy/concrete targets so we focus on the right keywords.",
  },
  launch: {
    focus: "confirming epoxy/concrete website launch details before the site goes live",
    questions: [
      "Do you already own a domain for your epoxy/concrete business, or do you need us to acquire one?",
      "What's your preferred domain name — something with 'epoxy', 'concrete', or your city in it?",
      "Do you need business email set up on that domain?",
      "Is there a specific date or timeframe you'd like to go live?",
    ],
    nextSteps:
      "Once live, we submit your epoxy/concrete site to Google Search Console and begin indexing & ranking for epoxy/concrete keywords.",
    opener:
      "We're almost live. Just a few launch details to confirm for your epoxy/concrete website:",
  },
  "index-rank": {
    focus: "briefing the client on the epoxy/concrete indexing & ranking phase (mostly automatic)",
    questions: [
      "Have you noticed any epoxy/concrete searches already bringing you traffic?",
      "Are there specific epoxy/concrete services you'd like us to prioritize ranking first — garage epoxy, polished concrete, decorative?",
    ],
    nextSteps:
      "After indexing is underway, we move to ongoing reporting & optimization — tracking, content refreshes and authority building for epoxy/concrete keywords.",
    opener:
      "Your epoxy/concrete site is live and we're submitting it to Google. This step runs automatically — any epoxy/concrete services you want us to rank first?",
  },
  optimize: {
    focus: "setting ongoing reporting & optimization preferences for epoxy/concrete",
    questions: [
      "Would you prefer weekly or monthly reporting?",
      "Which metrics matter most to you — epoxy/concrete leads, calls, rankings, traffic?",
      "Any new epoxy/concrete services or seasonal promotions you want to push — garage floor season, commercial coatings, patio stamping?",
    ],
    nextSteps:
      "From here we keep monitoring, refreshing content and building authority on an ongoing basis for your epoxy/concrete business.",
    opener:
      "You're in the ongoing optimization phase. Let me know how you'd like reporting and focus set up for your epoxy/concrete business.",
  },
};

// Fallback for any step without a specific guide.
const DEFAULT_GUIDE = {
  focus: "helping the client with their current step",
  questions: ["What would you like to focus on for this step?"],
  nextSteps: "We'll guide you to the next step once this one is complete.",
  opener: "I'm here to help with your current step. What can I clarify?",
};

export function getStepGuide(stepKey) {
  return STEP_GUIDES[stepKey] || DEFAULT_GUIDE;
}

// Builds the system prompt that scopes the assistant to the user's current step.
// `step` is a UNIVERSAL_PIPELINE entry; `pendingApproval` (if any) means the
// step is waiting on the client's sign-off.
export function buildAssistantPrompt(step, pendingApproval) {
  const guide = getStepGuide(step.key);
  const questionList = guide.questions.map((q) => `  - ${q}`).join("\n");

  if (pendingApproval) {
    return [
      `You are a friendly, concise assistant for a client on the "${step.label}" step.`,
      `Right now there is a PENDING APPROVAL for this step — the team has finished the work and is waiting on the client's sign-off.`,
      `Your job: answer questions about what they're approving, and guide them to the Approvals page to review and approve (or request changes).`,
      `Do NOT ask the onboarding questions below — the work is already done. Only answer questions about the pending deliverable.`,
      ``,
      `If the client asks what happens after they approve: ${guide.nextSteps}`,
      ``,
      `Keep replies short (2-4 sentences). If they seem unsure, point them to /approvals.`,
    ].join("\n");
  }

  return [
    `You are a friendly, concise assistant helping a client who is currently on the "${step.label}" step of their build pipeline.`,
    `Your ONLY job right now is to help with THIS step: ${guide.focus}.`,
    `Do not jump ahead to other steps or give generic advice. Stay scoped to "${step.label}".`,
    ``,
    `Ask the following questions — ONE AT A TIME, in order — and wait for the client's answer before asking the next:`,
    questionList,
    ``,
    `After the client has answered the relevant questions, summarize what they told you and explain what happens next:`,
    `${guide.nextSteps}`,
    ``,
    `Rules:`,
    `- Be warm but brief (2-4 sentences per reply).`,
    `- Never dump all questions at once — ask one, wait, then continue.`,
    `- If the client asks about something unrelated to "${step.label}", gently steer back to this step.`,
    `- If the client asks what happens after this step, answer with: ${guide.nextSteps}`,
  ].join("\n");
}

// The first message the chat shows for a given step.
export function buildOpener(step, pendingApproval, user) {
  const name = user?.full_name ? ` ${user.full_name}` : "";
  if (pendingApproval) {
    return `Hi${name}! Your ${step.label} is ready for review. I can answer any questions about what you're approving — then head to Approvals to sign off. What would you like to know?`;
  }
  const guide = getStepGuide(step.key);
  return `Hi${name}! ${guide.opener}`;
}

export { UNIVERSAL_PIPELINE };