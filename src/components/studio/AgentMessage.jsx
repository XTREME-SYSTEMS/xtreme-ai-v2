import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import AgentToolStatus from '@/components/studio/AgentToolStatus';

export default function AgentMessage({ message }) {
  const isUser = message.role === 'user';
  const text = isUser ? (message.content || '').split('\n\n[EDITOR CONTEXT]')[0] : message.content || '';
  return <article className="flex gap-3">
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">{isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</div>
    <div className="min-w-0 flex-1">
      <div className="mb-1 text-xs font-semibold">{isUser ? 'You' : 'Editor agent'}</div>
      {isUser ? <p className="whitespace-pre-wrap break-words text-sm">{text}</p> : <ReactMarkdown className="space-y-2 break-words text-sm [&_a]:underline [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:bg-secondary [&_pre]:p-2 [&_ul]:list-disc [&_ul]:pl-4">{text}</ReactMarkdown>}
      {(message.tool_calls || []).map((tool, i) => <AgentToolStatus key={tool.id || i} tool={tool} />)}
    </div>
  </article>;
}