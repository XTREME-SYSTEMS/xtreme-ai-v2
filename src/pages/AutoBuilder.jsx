import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AutoBuildQueue from "@/components/autobuilder/AutoBuildQueue";
import AutoBuildWorkspace from "@/components/autobuilder/AutoBuildWorkspace";

// Auto Builder — admin-side replica of the client portal pipeline with a
// queue. Admin creates builds, walks each through the same steps a client
// does (profile → names → content → logo → brand → website → social → video
// → review), and can flip on auto-advance for autonomous execution.
export default function AutoBuilder() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.AutoBuild.list("-created_date", 100);
      setBuilds(list || []);
      // Keep selection valid
      if (selectedId && !(list || []).some((b) => b.id === selectedId)) {
        setSelectedId((list && list[0]?.id) || null);
      }
    } catch {
      setBuilds([]);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll for updates while a step is running (status changes, auto-advance)
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [running, load]);

  const selected = builds.find((b) => b.id === selectedId) || null;

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 overflow-hidden rounded-xl border border-white/10">
      {/* Queue sidebar */}
      <div className="w-72 shrink-0 border-r border-white/10 bg-black/40">
        <AutoBuildQueue
          builds={builds}
          loading={loading}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreated={(b) => { setSelectedId(b.id); load(); }}
          onRefresh={load}
        />
      </div>
      {/* Workspace */}
      <div className="flex-1 bg-zinc-950">
        <AutoBuildWorkspace
          build={selected}
          onRefresh={load}
          running={running}
          setRunning={setRunning}
        />
      </div>
    </div>
  );
}