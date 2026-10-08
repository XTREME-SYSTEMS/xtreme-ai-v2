import { Link } from 'react-router-dom';
import { FolderOpen, ArrowUpRight, Loader2 } from 'lucide-react';
import useProjectsPage from '@/hooks/useProjectsPage';

export default function ProjectsList({ entity, title, email, search }) {
  const result = useProjectsPage(entity, email, search);
  const route = item => entity === 'OnboardingSession' ? `/onboarding?project=${item.id}` : entity === 'GptPack' ? `/onboarding?pack=${item.id}` : `/business-generator?project=${item.id}`;
  return <section className="space-y-3">
    <h2 className="text-base font-semibold">{title}</h2>
    {result.error && <p role="alert" className="text-sm">{result.error}</p>}
    {!result.loading && !result.error && !result.items.length && <p className="rounded-lg border border-border p-5 text-sm text-muted-foreground">{search ? 'No matching projects.' : 'No projects here yet.'}</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{result.items.map(item => <Link key={item.id} to={route(item)} className="group rounded-xl border border-border bg-card p-4 focus-visible:ring-2 focus-visible:ring-ring">
      <div className="flex items-center justify-between"><FolderOpen className="h-5 w-5 text-muted-foreground" /><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></div>
      <h3 className="mt-4 truncate text-sm font-semibold">{item.project_name || item.name || item.business_name || item.answers?.business_name?.answer_text || 'Untitled project'}</h3>
      <p className="mt-1 text-xs capitalize text-muted-foreground">{(item.status || (item.archived ? 'Archived' : 'Active')).replace(/_/g, ' ')}</p>
      <p className="mt-3 text-[11px] text-muted-foreground">Updated {new Date(item.updated_date || item.created_date).toLocaleDateString()}</p>
    </Link>)}</div>
    {result.loading && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading projects…</p>}
    {result.has_more && <button onClick={result.loadMore} disabled={result.loading} className="rounded-md border border-border px-4 py-2 text-xs disabled:opacity-40">Load more {title.toLowerCase()}</button>}
  </section>;
}