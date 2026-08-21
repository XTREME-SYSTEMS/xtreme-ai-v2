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
    focus: "capturing the client's core business details so the team can start work",
    questions: [
      "What's your business name (and website, if you have one)?",
      "What industry or niche are you in, and what services do you offer?",
      "Which cities or areas do you serve?",
      "What's the best phone number and email for customers to reach you?",
      "What makes your business different from your local competitors?",
    ],
    nextSteps:
      "Once I have your details, your team reviews them and prepares your tailored Strategy & Proposal — you'll approve that before we build anything.",
    opener:
      "Let's get your basics down so your team can start. I'll ask a few quick questions — one at a time.",
  },
  strategy: {
    focus: "confirming the client's goals so the team can prepare the right strategy & proposal",
    questions: [
      "What's your #1 goal right now — more leads, higher rankings, or a stronger brand?",
      "Roughly how many new leads per month would make this a win for you?",
      "Are there competitors you admire or want to out-rank?",
      "Any special offers, promotions, or seasonal services we should feature?",
    ],
    nextSteps:
      "After you approve the strategy, we move into your Brand Kit — logo, colors, business card, brochure and social posts.",
    opener:
      "Your team is preparing your strategy & proposal. While they work, let me ask a few questions to make sure the plan fits your goals.",
  },
  "brand-kit": {
    focus: "gathering brand preferences before the team generates the brand kit",
    questions: [
      "What's the vibe you want — modern, classic, bold, minimal, friendly?",
      "Any colors you love (or ones to avoid)?",
      "Do you have an existing logo, or are we starting from scratch?",
      "Got a tagline in mind, or want us to suggest a few?",
      "Any fonts or styles you're drawn to?",
    ],
    nextSteps:
      "Once you approve the brand kit, we move into your Website Build — design, copy and development.",
    opener:
      "Before we build your brand kit, let me nail down your style preferences so the first round is on target.",
  },
  website: {
    focus: "confirming website scope and must-haves before the team builds the site",
    questions: [
      "Which pages do you need — Home, About, Services, Contact, Blog, others?",
      "Any must-have features — booking, quote form, gallery, online payments?",
      "Are there websites you like the look of?",
      "Do you have content (text, photos) ready, or should we write it all?",
    ],
    nextSteps:
      "After you approve the site, we optimize it for SEO & AEO (on-page, schema, AI-search).",
    opener:
      "Let's scope your website so the build matches what you need. A few quick questions:",
  },
  "seo-aeo": {
    focus: "confirming SEO targets before the team optimizes the site",
    questions: [
      "What are the top keywords you want to show up for?",
      "Which cities or neighborhoods matter most to you?",
      "Do you already have a Google Business Profile set up?",
      "Any competitors consistently showing up above you in search?",
    ],
    nextSteps:
      "After approval, we deploy your site to your live domain (Launch).",
    opener:
      "Before we optimize for search, let me confirm your targets so we focus on the right keywords.",
  },
  launch: {
    focus: "confirming launch details before the site goes live",
    questions: [
      "Do you already own a domain, or do you need us to acquire one?",
      "What's your preferred domain name?",
      "Do you need business email set up on that domain?",
      "Is there a specific date or timeframe you'd like to go live?",
    ],
    nextSteps:
      "Once live, we submit your site to Google Search Console and begin indexing & ranking.",
    opener:
      "We're almost live. Just a few launch details to confirm:",
  },
  "index-rank": {
    focus: "briefing the client on the indexing & ranking phase (mostly automatic)",
    questions: [
      "Have you noticed any searches already bringing you traffic?",
      "Are there specific pages or services you'd like us to prioritize ranking first?",
    ],
    nextSteps:
      "After indexing is underway, we move to ongoing reporting & optimization — tracking, content refreshes and authority building.",
    opener:
      "Your site is live and we're submitting it to Google. This step runs automatically on our end — any priorities you want us to rank first?",
  },
  optimize: {
    focus: "setting ongoing reporting & optimization preferences",
    questions: [
      "Would you prefer weekly or monthly reporting?",
      "Which metrics matter most to you — leads, calls, rankings, traffic?",
      "Any new services or promotions you want to push in the coming months?",
    ],
    nextSteps:
      "From here we keep monitoring, refreshing content and building authority on an ongoing basis.",
    opener:
      "You're in the ongoing optimization phase. Let me know how you'd like reporting and focus set up.",
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