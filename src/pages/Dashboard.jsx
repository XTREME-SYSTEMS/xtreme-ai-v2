import CommandCenter from "@/pages/CommandCenter";
import ClientDashboard from "@/pages/ClientDashboard";
import WelcomeModal from "@/components/WelcomeModal";
import PipelineShell from "@/components/studio/PipelineShell";
import { usePreview } from "@/lib/PreviewContext";
import { useClientUser } from "@/hooks/useClientUser";

export default function Dashboard() {
  const { previewAsClient } = usePreview();
  const { user, loading } = useClientUser();

  if (loading) {
    return (
      <PipelineShell>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      </PipelineShell>
    );
  }

  const role = user?.role || "user";

  return (
    <PipelineShell>
      <WelcomeModal user={user} role={role} />
      {role === "admin" && !previewAsClient ? <CommandCenter /> : <ClientDashboard />}
    </PipelineShell>
  );
}