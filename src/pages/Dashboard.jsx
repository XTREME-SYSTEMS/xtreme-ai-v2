import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import CommandCenter from "@/pages/CommandCenter";
import ClientDashboard from "@/pages/ClientDashboard";

export default function Dashboard() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    base44.auth.me()
      .then((u) => setRole(u?.role || "user"))
      .catch(() => setRole("user"));
  }, []);

  if (role === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-lime-400" />
      </div>
    );
  }

  return role === "admin" ? <CommandCenter /> : <ClientDashboard />;
}