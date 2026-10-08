import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useStudioProject from '@/hooks/useStudioProject';
import StudioTopBar from '@/components/studio/StudioTopBar';
import StudioActions from '@/components/studio/StudioActions';
import StudioImportDialog from '@/components/studio/StudioImportDialog';
import ChatPanel from '@/components/studio/ChatPanel';
import VisualEditor from '@/components/studio/VisualEditor';

export default function OnboardingAssistant() {
  const studio = useStudioProject();
  const navigate = useNavigate();
  const [device, setDevice] = useState('desktop');
  const [inspect, setInspect] = useState(true);
  const [sourceMode, setSourceMode] = useState(false);
  const [selection, setSelection] = useState(null);
  const [draft, setDraft] = useState(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  useEffect(() => { setSelection(null); setDraft(null); }, [studio.project?.id, studio.html]);
  const save = async () => { if (draft !== null && await studio.save(draft)) setDraft(null); };
  return <div className="studio-workspace flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
    <StudioTopBar project={studio.project}><StudioActions device={device} setDevice={setDevice} inspect={inspect} setInspect={setInspect} sourceMode={sourceMode} setSourceMode={setSourceMode} save={save} saving={studio.saving} dirty={draft !== null} onPaste={() => setPasteOpen(true)} onNew={() => navigate(`/onboarding?new=${crypto.randomUUID()}`)} /></StudioTopBar>
    {studio.error && <p role="alert" className="shrink-0 border-b border-destructive/40 px-4 py-2 text-sm">{studio.error}</p>}
    {studio.loading ? <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : studio.project && <main className="grid min-h-0 flex-1 grid-rows-2 md:grid-cols-[minmax(280px,38%)_minmax(0,1fr)] md:grid-rows-1">
      <div className="min-h-0 min-w-0 border-b border-border md:border-b-0 md:border-r"><ChatPanel key={studio.project.id} project={studio.project} selection={selection} onConversation={id => studio.setProject(prev => ({ ...prev, studio_conversation_id: id }))} /></div>
      <div className="min-h-0 min-w-0"><VisualEditor html={studio.html} sourceMode={sourceMode} device={device} inspect={inspect} onSelect={setSelection} onDraftChange={setDraft} loading={studio.documentLoading} /></div>
    </main>}
    <StudioImportDialog open={pasteOpen} onOpenChange={setPasteOpen} save={studio.save} saving={studio.saving} />
  </div>;
}