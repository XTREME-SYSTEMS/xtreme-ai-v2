import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import CommandCenter from "@/pages/CommandCenter";
import ClientDashboard from "@/pages/ClientDashboard";
import WelcomeModal from "@/components/WelcomeModal";
import { usePreview } from "@/lib/PreviewContext";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const { previewAsClient } = usePreview();

  useEffect(() => {
    base44.auth.me()
      .then((u) => setUser(u))
      .catch(() => setUser({ role: "user" }));
  }, []);

  if (user === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-lime-400" />
      </div>
    );
  }

  const role = user?.role || "user";

  return (
    <>
      <WelcomeModal user={user} role={role} />
      {role === "admin" && !previewAsClient ? <CommandCenter /> : <ClientDashboard />}
    </>
  );
}