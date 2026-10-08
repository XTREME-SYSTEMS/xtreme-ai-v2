import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export default function useStudioAgent(project, selection, onConversation) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const initRef = useRef({});
  const callbackRef = useRef(onConversation);
  callbackRef.current = onConversation;
  useEffect(() => {
    if (!project?.id) return;
    let stopped = false;
    setConversation(null); setMessages([]); setError('');
    if (!initRef.current[project.id]) initRef.current[project.id] = (async () => {
      if (project.studio_conversation_id) return base44.agents.getConversation(project.studio_conversation_id);
      const created = await base44.agents.createConversation({ agent_name: 'studio_editor', metadata: { name: project.project_name || 'Website editor', description: `Editor project ${project.id}`, project_id: project.id } });
      await base44.entities.OnboardingSession.update(project.id, { studio_conversation_id: created.id });
      return created;
    })();
    initRef.current[project.id].then(conv => {
      if (stopped) return;
      setConversation(conv); setMessages(conv.messages || []); callbackRef.current?.(conv.id);
    }).catch(e => { delete initRef.current[project.id]; if (!stopped) setError(e.message || 'Could not open the agent conversation.'); });
    return () => { stopped = true; };
  }, [project?.id]);
  useEffect(() => {
    if (!conversation?.id) return;
    return base44.agents.subscribeToConversation(conversation.id, data => setMessages(data.messages || []));
  }, [conversation?.id]);
  const send = async text => {
    if (!conversation || sending) return false;
    setSending(true); setError('');
    const context = { project_id: project.id, name: project.project_name, revision: project.draft_revision || 0, selected_element: selection || null };
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: `${text.trim()}\n\n[EDITOR CONTEXT]\n${JSON.stringify(context)}` });
      return true;
    } catch (e) { setError(e.message || 'The agent could not respond. Check editor permissions and workspace integration credits.'); return false; }
    finally { setSending(false); }
  };
  const toolsRunning = messages.some(m => (m.tool_calls || []).some(t => ['pending', 'running', 'in_progress'].includes(t.status)));
  return { messages, ready: !!conversation, busy: sending || toolsRunning, error, send };
}