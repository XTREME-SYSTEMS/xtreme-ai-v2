import { useEffect } from "react";
import WebsiteDesignStudio from "@/components/website/WebsiteDesignStudio";
import BackButton from "@/components/client/BackButton";

// Website Design step: the client sees their logo & brand on 10 real website
// layouts (desktop + mobile), filled with location-aware content generated
// from their onboarding profile. They pick one and approve — that exact layout
// is what gets built.
export default function DesignDirection() {
  useEffect(() => {
    document.title = "Website Design · Lead Gen Near You";
  }, []);
  return (
    <div className="mx-auto max-w-5xl">
      <BackButton to="/brand-generator" />
      <WebsiteDesignStudio />
    </div>
  );
}