import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import EditorCanvas from '@/components/studio/EditorCanvas';

export default function VisualEditor({ html, sourceMode, device, inspect, onSelect, onDraftChange, loading }) {
  const [source, setSource] = useState(html);
  useEffect(() => { setSource(html); onDraftChange(null); }, [html]);
  if (sourceMode) return <div className="flex h-full min-h-0 flex-col bg-secondary p-3"><label htmlFor="studio-source" className="mb-2 text-xs text-muted-foreground">Website HTML · Save draft in the header to update the canvas</label><textarea id="studio-source" value={source} onChange={e => { setSource(e.target.value); onDraftChange(e.target.value); }} spellCheck={false} className="min-h-0 flex-1 resize-none rounded-lg border border-border bg-background p-3 font-mono text-xs text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" /></div>;
  return <section className="relative h-full min-h-0 bg-secondary" aria-label="Website visual editor">
    {loading && <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-md bg-card p-2 text-xs" role="status"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating canvas…</div>}
    <EditorCanvas html={html} device={device} inspect={inspect} onSelect={onSelect} />
  </section>;
}