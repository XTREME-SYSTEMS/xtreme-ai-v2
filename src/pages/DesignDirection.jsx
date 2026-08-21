import { useEffect } from "react";
import WebsiteDesignStudio from "@/components/website/WebsiteDesignStudio";

// Website Design step: the client sees their logo & brand on 10 real website
// layouts (desktop + mobile), filled with location-aware content generated
// from their onboarding profile. They pick one and approve — that exact layout
// is what gets built.
export default function DesignDirection() {
  useEffect(() => {
    document.title = "Website Design · Lead Gen Near You";
  }, []);
  return <WebsiteDesignStudio />;
}