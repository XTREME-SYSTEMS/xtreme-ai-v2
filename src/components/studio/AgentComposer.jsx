import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function AgentComposer({ send, busy, ready, selection }) {
  const [input, setInput] = useState('');
  const submit = async () => { if (!input.trim() || busy || !ready) return; const text = input; setInput(''); const ok = await send(text); if (!ok) setInput(text); };
  return <div className="border-t border-border p-3">
    {selection && <p className="mb-2 truncate text-xs text-muted-foreground">Selected: {selection.tag} · {selection.text || selection.selector}</p>}
    <label htmlFor="studio-agent-message" className="sr-only">Message your editor agent</label>
    <div className="flex items-end gap-2 rounded-xl border border-border bg-secondary p-2">
      <textarea id="studio-agent-message" rows={3} value={input} onChange={e => setInput(e.target.value)} placeholder="Build a page, change the layout, edit a selected element…" className="min-w-0 flex-1 resize-none bg-transparent p-1 text-sm placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" disabled={!ready || busy} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }} />
      <button onClick={submit} disabled={!input.trim() || !ready || busy} aria-label="Send to editor agent" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
    </div>
    <p className="mt-2 text-[11px] text-muted-foreground">Enter to send · Shift + Enter for a new line</p>
  </div>;
}