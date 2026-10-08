import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StudioTopBar from '@/components/studio/StudioTopBar';
import ProjectsList from '@/components/studio/ProjectsList';

export default function Projects() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { base44.auth.me().then(setUser).catch(e => setError(e.message)); }, []);
  return <div className="studio-workspace flex h-dvh flex-col bg-background text-foreground">
    <StudioTopBar />
    <main className="min-h-0 flex-1 space-y-8 overflow-y-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Your projects</h2><p className="mt-1 text-sm text-muted-foreground">Open any saved project and continue where you left off.</p></div><Link to={`/onboarding?new=${crypto.randomUUID()}`} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New project</Link></div>
      <div className="flex max-w-md items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"><Search className="h-4 w-4 text-muted-foreground" /><label htmlFor="project-search" className="sr-only">Search all projects</label><input id="project-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all projects…" className="w-full bg-transparent text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" /></div>
      {error && <p role="alert">{error}</p>}
      <ProjectsList entity="OnboardingSession" title="Studio projects" email={user?.email} search={search} />
      <ProjectsList entity="GptPack" title="Website packs" email={user?.email} search={search} />
      <ProjectsList entity="ClientProject" title="Business projects" email={user?.email} search={search} />
    </main>
  </div>;
}