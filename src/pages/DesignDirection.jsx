import { useEffect } from "react";
import DesignPackPicker from "@/components/client/DesignPackPicker";

// Step 3 of the epoxy website build: the client picks up to 3 design
// directions from 10 curated logo/web packs. The selection is saved as a
// design DNA profile that informs the actual website build.
export default function DesignDirection() {
  useEffect(() => {
    document.title = "Design Direction · Lead Gen Near You";
  }, []);

  return <DesignPackPicker />;
}