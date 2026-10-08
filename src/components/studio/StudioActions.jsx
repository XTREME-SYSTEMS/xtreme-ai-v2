import { Monitor, Smartphone, Tablet, Code2, MousePointer2, Save, Loader2, ClipboardPaste, Plus } from 'lucide-react';

export default function StudioActions({ device, setDevice, inspect, setInspect, sourceMode, setSourceMode, save, saving, dirty, onPaste, onNew }) {
  const tools = [{ value: 'desktop', Icon: Monitor }, { value: 'tablet', Icon: Tablet }, { value: 'mobile', Icon: Smartphone }];
  const style = 'flex h-8 items-center gap-1.5 rounded-md border border-border px-2 text-xs hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40';
  return <div className="flex shrink-0 items-center gap-1.5" aria-label="Editor controls">
    {tools.map(({ value, Icon }) => <button key={value} aria-label={`${value} preview`} aria-pressed={device === value} onClick={() => setDevice(value)} className={`${style} ${device === value ? 'bg-primary text-primary-foreground' : ''}`}><Icon className="h-3.5 w-3.5" /></button>)}
    <button onClick={() => setInspect(!inspect)} aria-pressed={inspect} className={`${style} ${inspect ? 'bg-primary text-primary-foreground' : ''}`}><MousePointer2 className="h-3.5 w-3.5" /><span className="hidden lg:inline">Select</span></button>
    <button onClick={() => setSourceMode(!sourceMode)} aria-pressed={sourceMode} className={`${style} ${sourceMode ? 'bg-secondary' : ''}`}><Code2 className="h-3.5 w-3.5" /><span>{sourceMode ? 'Canvas' : 'Source'}</span></button>
    <button onClick={onPaste} className={style}><ClipboardPaste className="h-3.5 w-3.5" /><span>Paste</span></button>
    <button onClick={save} disabled={!dirty || saving} className={`${style} bg-primary text-primary-foreground`}>{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}<span>Save draft</span></button>
    <button onClick={onNew} className={style}><Plus className="h-3.5 w-3.5" />New project</button>
  </div>;
}