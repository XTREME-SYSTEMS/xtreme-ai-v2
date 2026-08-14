import AiOnboardingChat from "@/components/brand/AiOnboardingChat";
import { brandBriefSchema } from "@/lib/brandPrompts";

const QUESTIONS = [
  "What's the name of your business?",
  "What does your business do — what products or services do you offer?",
  "Who is your ideal customer?",
  "Where are you located, or what area do you serve?",
  "Describe the vibe or style you want for the brand (e.g. modern, luxury, friendly, bold, minimal).",
  "What contact info should appear on your brand assets? (phone, email, website)",
];

export default function StepConcept({ project, ensureProject, goNext }) {
  return (
    <AiOnboardingChat
      title="Brand Interview"
      subtitle="answer naturally, I'll guide you"
      questions={QUESTIONS}
      greetingPrefix="Hi! I'm your brand strategist. Let's build your brand from scratch."
      completeLabel="Generate Brand Brief"
      aiRoleName="Strategist"
      extractionPrompt={(t) => `From this brand intake conversation, extract a structured brand brief. Fill every field; use empty string if missing.\n\n${t}`}
      extractionSchema={brandBriefSchema()}
      onComplete={async (brief) => {
        await ensureProject({
          business_name: brief.business_name || "Untitled Brand",
          industry: brief.industry || "",
          description: brief.description || "",
          audience: brief.audience || "",
          vibe: brief.vibe || "",
          contact: brief.contact || {},
          current_step: "strategy",
          status: "running",
          logs: ["Concept brief generated"],
        });
        goNext();
      }}
    />
  );
}