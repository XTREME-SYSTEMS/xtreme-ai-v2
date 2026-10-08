import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function StudioImportDialog({ open, onOpenChange, save, saving }) {
  const [html, setHtml] = useState('');
  const submit = async () => { if (await save(html)) { setHtml(''); onOpenChange(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Paste website HTML</DialogTitle><DialogDescription>Import a website document into this project's private draft.</DialogDescription></DialogHeader><label htmlFor="studio-import" className="text-sm">HTML document</label><textarea id="studio-import" rows={14} value={html} onChange={e => setHtml(e.target.value)} className="w-full resize-y rounded-lg border border-border bg-background p-3 font-mono text-xs" /><button onClick={submit} disabled={saving || !html.trim()} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40">{saving ? 'Saving…' : 'Import draft'}</button></DialogContent></Dialog>;
}