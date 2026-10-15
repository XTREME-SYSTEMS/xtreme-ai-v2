import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AiOnboardingChat from "@/components/brand/AiOnboardingChat";
import { useClientTrack } from "@/hooks/useClientTrack";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

const QUESTIONS = [
  "What's the name of your business?",
  "What does your business do — what products or services do you offer?",
  "What are your main goals right now? (e.g. more leads, rank higher on Google, build a brand)",
  "What's the biggest challenge you're facing with marketing or growth?",
  "Where are you located, or what area do you serve?",
  "What's the best way for your team to reach you? (phone, email)",
];

const SCHEMA = {
  type: "object",
  properties: {
    business_name: { type: "string" },
    description: { type: "string" },
    goals: { type: "string" },
    challenges: { type: "string" },
    location: { type: "string" },
    contact: {
      type: "object",
      properties: {
        phone: { type: "string" },
        email: { type: "string" },
      },
    },
    summary: { type: "string" },
  },
};

export default function ClientOnboarding({ user }) {
  const [done, setDone] = useState(false);
  const { track } = useClientTrack(user);

  if (user?.onboarded || done) {
    const cta = track.cta || { to: "/brand-factory", label: "Start Brand Factory" };
    return (
      <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-lime-400" />
          <h2 className="text-sm font-semibold text-white">Onboarding complete</h2>
        </div>
        <p className="mt-1 text-sm text-white/70">
          Thanks{user?.onboarding?.business_name ? `, ${user.onboarding.business_name}` : ""}! Your team has your info. {track.subtitle}
        </p>
        <Link to={cta.to} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-lime-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-lime-300">
          <Sparkles className="h-3.5 w-3.5" /> {cta.label} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  const subtitle = track.title && track.title !== "Welcome" ? `${track.title} · let's get to know your business` : "let's get to know your business";

  return (
    <AiOnboardingChat
      title="AI Onboarding"
      subtitle={subtitle}
      questions={QUESTIONS}
      greetingPrefix={track.greeting || "Hi! I'm your onboarding assistant. Welcome aboard."}
      completeLabel="Finish Onboarding"
      aiRoleName="Assistant"
      extractionPrompt={(t) => `From this onboarding conversation, extract a structured client profile. Fill every field; use empty string if missing.\n\n${t}`}
      extractionSchema={SCHEMA}
      onComplete={async (data) => {
        await base44.auth.updateMe({ onboarding: data, onboarded: true });
        setDone(true);
      }}
    />
  );
}