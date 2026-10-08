import { MousePointer2 } from 'lucide-react';

export default function EditorEmptyState() {
  return <div className="flex h-full items-center justify-center bg-secondary p-8 text-center">
    <div className="max-w-sm"><MousePointer2 className="mx-auto h-9 w-9 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">Your visual editor</h2><p className="mt-2 text-sm text-muted-foreground">Tell the agent on the left what to build. Its saved changes appear here automatically.</p><p className="mt-3 text-xs text-muted-foreground">Open an existing project or paste a website using the header controls.</p></div>
  </div>;
}