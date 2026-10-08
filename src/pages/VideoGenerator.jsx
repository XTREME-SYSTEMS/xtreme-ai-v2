import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StudioTopBar from '@/components/studio/StudioTopBar';
import VideoImageUploader from '@/components/videogen/VideoImageUploader';
import VideoJobCard from '@/components/videogen/VideoJobCard';

const MODELS = [
  { value: 'seedance_2_5', label: 'Seedance 2.5', maxSeconds: 30, resolutions: ['480p', '720p'], note: 'Best for long clips with image references' },
  { value: 'seedance_2', label: 'Seedance 2', maxSeconds: 15, resolutions: ['480p', '720p', '1080p', '4K'], note: 'Higher resolution, shorter clips' },
  { value: 'seedance_2_fast', label: 'Seedance 2 Fast', maxSeconds: 15, resolutions: ['480p', '720p'], note: 'Faster generation, lower cost' },
];

const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4'];

export default function VideoGenerator() {
  const [user, setUser] = useState(null);
  const [images, setImages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('seedance_2_5');
  const [seconds, setSeconds] = useState(15);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('720p');
  const [generateAudio, setGenerateAudio] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState([]);

  const activeModel = MODELS.find(m => m.value === model);
  const maxSeconds = activeModel?.maxSeconds || 30;

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.email) {
        base44.entities.VideoJob.filter({ user_email: u.email }, { sort: '-created_date', limit: 20 })
          .then(page => setJobs(page.items || []))
          .catch(() => {});
      }
    }).catch(e => setError(e.message));
  }, []);

  const generate = async () => {
    if (!prompt.trim()) { setError('Enter a prompt describing your video.'); return; }
    if (images.length === 0) { setError('Upload at least one reference image.'); return; }
    setGenerating(true); setError('');
    try {
      const job = await base44.entities.VideoJob.create({
        user_email: user.email,
        prompt: prompt.trim(),
        model, seconds, aspect_ratio: aspectRatio, resolution,
        generate_audio: generateAudio,
        image_uris: images.map(i => i.file_uri),
        status: 'pending',
      });
      setJobs(prev => [job, ...prev]);
      const request = {
        model,
        prompt: prompt.trim(),
        seconds,
        aspect_ratio: aspectRatio,
        resolution,
        generate_audio: generateAudio,
        input_references: images.slice(0, 8).map(img => ({
          type: 'image_url',
          image_url: { url: img.file_uri },
        })),
      };
      const { data } = await base44.functions.invoke('video-gateway', { action: 'create', request, job_id: job.id });
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, gateway_video_id: data.video_id, status: data.status || 'queued' } : j));
      setPrompt(''); setImages([]);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not start generation.');
    } finally { setGenerating(false); }
  };

  return (
    <div className="studio-workspace flex h-dvh min-h-0 flex-col bg-background text-foreground">
      <StudioTopBar />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold"><Sparkles className="h-5 w-5 text-primary" /> AI Video Generator</h1>
            <p className="mt-1 text-sm text-muted-foreground">Upload reference images, describe your video, and generate a 15-30 second AI clip.</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-5">
            <VideoImageUploader images={images} setImages={setImages} />

            <div className="space-y-2">
              <label className="text-sm font-semibold">Video prompt</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} placeholder="Describe the motion, camera, style, and mood you want…" className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Model</label>
              <select value={model} onChange={e => { setModel(e.target.value); const m = MODELS.find(x => x.value === e.target.value); setSeconds(prev => Math.min(prev, m.maxSeconds)); setResolution(prev => m.resolutions.includes(prev) ? prev : m.resolutions[0]); }} className="w-full rounded-lg border border-border bg-background p-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                {MODELS.map(m => <option key={m.value} value={m.value}>{m.label} · up to {m.maxSeconds}s — {m.note}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between"><label className="text-sm font-semibold">Duration</label><span className="text-sm font-mono text-primary">{seconds}s</span></div>
              <input type="range" min={15} max={maxSeconds} step={1} value={seconds} onChange={e => setSeconds(Number(e.target.value))} className="w-full accent-primary" />
              <p className="text-[11px] text-muted-foreground">15-{maxSeconds}s per clip. For longer videos, generate multiple clips.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Aspect ratio</label>
                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full rounded-lg border border-border bg-background p-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                  {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Resolution</label>
                <select value={resolution} onChange={e => setResolution(e.target.value)} className="w-full rounded-lg border border-border bg-background p-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                  {activeModel?.resolutions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={generateAudio} onChange={e => setGenerateAudio(e.target.checked)} className="accent-primary" />
              Generate audio
            </label>

            {error && <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm">{error}</p>}

            <button onClick={generate} disabled={generating || !prompt.trim() || images.length === 0} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40">
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting generation…</> : <><Sparkles className="h-4 w-4" /> Generate video</>}
            </button>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Video generation uses integration credits and takes 1-5 minutes per clip. The platform supports up to 30 seconds per clip — for a 60-second video, generate two 30s clips. Your uploaded images are stored privately — no public URL, so access follows your app's permissions.</p>
          </div>

          {jobs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold">Your video jobs</h2>
              {jobs.map(job => <VideoJobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}