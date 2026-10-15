import { useEffect } from "react";
import { useClientTrack } from "@/hooks/useClientTrack";
import { useClientUser } from "@/hooks/useClientUser";
import { getPackage } from "@/lib/packageContents";
import ClientAssistantChat from "@/components/client/ClientAssistantChat";
import { Bot } from "lucide-react";

// Dedicated AI assistant tab for the client portal.
export default function Assistant() {
  const { user } = useClientUser();
  const { track } = useClientTrack(user);
  const pkg = getPackage(track.key);

  useEffect(() => {
    document.title = "Assistant · Lead Gen Near You";
  }, []);

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="flex items-center gap-2 px-1 pb-3">
        <Bot className="h-5 w-5 text-lime-400" />
        <h1 className="text-lg font-semibold text-white">AI Assistant</h1>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-white/40">AI</span>
      </div>
      <div className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
        <ClientAssistantChat user={user} pkg={pkg} />
      </div>
    </div>
  );
}