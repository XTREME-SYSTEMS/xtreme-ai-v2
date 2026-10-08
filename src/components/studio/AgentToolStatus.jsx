import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function AgentToolStatus({ tool }) {
  let result = tool.results;
  if (typeof result === 'string') { try { result = JSON.parse(result); } catch { /* Display text results unchanged. */ } }
  const failed = ['failed', 'error'].includes(tool.status) || result?.success === false || /error|failed/i.test(typeof result === 'string' ? result : JSON.stringify(result || {}));
  const active = ['pending', 'running', 'in_progress'].includes(tool.status);
  const projection = tool.display_projection;
  const label = failed ? projection?.error_label || 'Editor action failed' : active ? projection?.active_label || 'Updating the editor…' : projection?.label || 'Editor action completed';
  const Icon = failed ? AlertCircle : active ? Loader2 : CheckCircle2;
  return <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground" role="status"><Icon className={active ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} /><span>{label}</span></div>;
}