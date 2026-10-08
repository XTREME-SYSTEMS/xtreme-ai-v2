import { useEffect, useRef } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import useStudioAgent from '@/hooks/useStudioAgent';
import AgentMessage from '@/components/studio/AgentMessage';
import AgentComposer from '@/components/studio/AgentComposer';

export default function ChatPanel({ project, selection, onConversation }) {
  const agent = useStudioAgent(project, selection, onConversation);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); }, [agent.messages, agent.busy]);
  return <aside className="flex h-full min-h-0 flex-col bg-card" aria-label="Editor agent conversation">
    <div className="flex items-center gap-2 border-b border-border px-4 py-3"><Bot className="h-4 w-4" /><h2 className="text-sm font-semibold">Editor agent</h2><span className="ml-auto text-[10px] text-muted-foreground">Controls this canvas</span></div>
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4" role="log" aria-label="Conversation" aria-live="polite">
      {!agent.ready && !agent.error && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Opening your conversation…</div>}
      {agent.ready && !agent.messages.length && <div className="py-8"><h3 className="text-xl font-semibold">What would you like to build?</h3><p className="mt-3 text-sm text-muted-foreground">I edit the website on the right. Describe a new page, ask for a layout change, or select an element and tell me what to change.</p></div>}
      {agent.messages.filter(message => ['user', 'assistant'].includes(message.role)).map((message, i) => <AgentMessage key={message.id || i} message={message} />)}
      {agent.busy && <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin" /> Agent is working…</div>}
      {agent.error && <p className="rounded-lg border border-destructive/40 p-3 text-sm" role="alert">{agent.error}</p>}
      <div ref={bottomRef} />
    </div>
    <AgentComposer send={agent.send} ready={agent.ready} busy={agent.busy} selection={selection} />
  </aside>;
}