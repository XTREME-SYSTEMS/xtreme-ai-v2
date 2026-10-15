import { useEffect } from "react";
import LogoGenerator from "@/components/client/LogoGenerator";

// Step: Logo Generator page wrapper.
export default function LogoGeneratorPage() {
  useEffect(() => {
    document.title = "Logo Generator · Lead Gen Near You";
  }, []);
  return <LogoGenerator />;
}