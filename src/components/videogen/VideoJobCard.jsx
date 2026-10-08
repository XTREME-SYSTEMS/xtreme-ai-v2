import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Download, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VideoJobCard({ job, onRemove }) {
  const [current, setCurrent] = useState(job);

  useEffect(() => {
    setCurrent(job);
    if (!job.gateway_video_id || job.status === 'complete' || job.status === 'failed') return;
    let stopped = false;
    const poll = async () => {
      for (let attempt = 0; attempt < 80; attempt++) {
        if (stopped) return;
        await new Promise(r => setTimeout(r, 15000));
        if (stopped) return;
        try {
          const { data: video } = await base44.functions.invoke('video-gateway', { action: 'retrieve', videoId: job.gateway_video_id, job_id: job.id });
          if (stopped) return;
          if (video.status === 'complete') { setCurrent(prev => ({ ...prev, status: 'complete', video_url: video.url })); return; }
          if (video.status === 'failed') { setCurrent(prev => ({ ...prev, status: 'failed', error: video.error?.message || 'Generation failed' })); return; }
          setCurrent(prev => ({ ...prev, status: video.status || 'in_progress' }));
        } catch (e) { if (stopped) return; }
      }
    };
    poll();
    return () => { stopped = true; };
  }, [job.id, job.gateway_video_id]);

  const statusIcon = {
    pending: <Clock className="h-4 w-4 text-muted-foreground" />,
    queued: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
    in_progress: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
    complete: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    failed: <AlertCircle className="h-4 w-4 text-destructive" />,
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        {statusIcon[current.status]}
        <span className="text-sm font-medium capitalize">{(current.status || 'pending').replace(/_/g, ' ')}</span>
        <span className="ml-auto text-[11px] text-muted-foreground">{current.seconds}s · {current.model}</span>
      </div>
      {current.status === 'complete' && current.video_url ? (
        <div className="space-y-3 p-4">
          <video src={current.video_url} controls className="w-full rounded-lg border border-border" />
          <a href={current.video_url} download className="flex items-center gap-1.5 text-xs text-primary hover:underline"><Download className="h-3.5 w-3.5" /> Download video</a>
        </div>
      ) : current.status === 'failed' ? (
        <div className="p-4 text-sm text-destructive">{current.error || 'Generation failed.'}</div>
      ) : (
        <div className="space-y-2 p-4">
          <p className="text-sm text-muted-foreground">{current.status === 'pending' ? 'Waiting to start…' : 'Generating your video. This can take 1-5 minutes.'}</p>
          {current.image_uris?.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto">
              {current.image_uris.slice(0, 6).map((uri, i) => <img key={i} src={uri} alt="" className="h-12 w-12 shrink-0 rounded border border-border object-cover" />)}
            </div>
          )}
          <p className="line-clamp-2 text-xs text-muted-foreground">{current.prompt}</p>
        </div>
      )}
    </div>
  );
}