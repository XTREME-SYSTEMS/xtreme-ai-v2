import { useEffect, useMemo, useRef } from 'react';
import EditorEmptyState from '@/components/studio/EditorEmptyState';

export default function EditorCanvas({ html, device, inspect, onSelect }) {
  const frameRef = useRef(null);
  const document = useMemo(() => {
    if (!html || !inspect) return html;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const style = doc.createElement('style');
    style.textContent = 'body * {cursor:crosshair!important} [data-studio-selected] {outline:2px solid #0047ff!important;outline-offset:2px}';
    doc.head.appendChild(style);
    const script = doc.createElement('script');
    script.textContent = `document.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();const el=e.target;if(!el||el.tagName==='HTML')return;document.querySelectorAll('[data-studio-selected]').forEach(n=>n.removeAttribute('data-studio-selected'));const snippet=el.outerHTML;el.setAttribute('data-studio-selected','true');let path=[],n=el;while(n&&n.tagName!=='HTML'){const tag=n.tagName.toLowerCase(),siblings=Array.from(n.parentElement?.children||[]).filter(s=>s.tagName===n.tagName);path.unshift(tag+':nth-of-type('+(siblings.indexOf(n)+1)+')');n=n.parentElement;}window.parent.postMessage({type:'studio-element',selector:path.join(' > '),tag:el.tagName.toLowerCase(),text:(el.textContent||'').slice(0,400),html:snippet.slice(0,6000)},'*');},true);`;
    doc.body.appendChild(script);
    return '<!DOCTYPE html>' + doc.documentElement.outerHTML;
  }, [html, inspect]);
  useEffect(() => {
    const handler = event => { if (inspect && event.source === frameRef.current?.contentWindow && event.data?.type === 'studio-element') onSelect(event.data); };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [inspect, onSelect]);
  if (!html) return <EditorEmptyState />;
  const width = device === 'mobile' ? 390 : device === 'tablet' ? 768 : '100%';
  return <div className="flex h-full min-h-0 justify-center overflow-auto bg-secondary p-2 sm:p-4"><iframe ref={frameRef} srcDoc={document} sandbox="allow-scripts" title="Website visual editor" style={{ width, maxWidth: '100%' }} className="h-full min-h-0 shrink-0 rounded-lg border border-border" /></div>;
}