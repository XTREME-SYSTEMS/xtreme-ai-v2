import CommandCenter from "@/pages/CommandCenter";
import ClientDashboard from "@/pages/ClientDashboard";
import WelcomeModal from "@/components/WelcomeModal";
import { usePreview } from "@/lib/PreviewContext";
import { useClientUser } from "@/hooks/useClientUser";

export default function Dashboard() {
  const { previewAsClient } = usePreview();
  const { user, loading } = useClientUser();

  if (loading) {
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