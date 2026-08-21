import { useEffect } from "react";
import BrandGenerator from "@/components/client/BrandGenerator";

// Step: Brand Generator page wrapper.
export default function BrandGeneratorPage() {
  useEffect(() => {
    document.title = "Brand Generator · Lead Gen Near You";
  }, []);
  return <BrandGenerator />;
}