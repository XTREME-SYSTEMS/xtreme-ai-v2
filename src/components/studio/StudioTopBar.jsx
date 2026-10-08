import { Link, useLocation } from 'react-router-dom';
import { FolderOpen, PanelsTopLeft, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { LOGO_ICON } from '@/lib/brandAssets';
import StudioSteps from '@/components/studio/StudioSteps';

export default function StudioTopBar({ project, children }) {
  const location = useLocation();
  const projectsPage = location.pathname === '/projects';
  return <header className="shrink-0 border-b border-border bg-card">
    <div className="flex items-center gap-3 px-3 py-2">
      <Image src={LOGO_ICON} alt="Auto Builder" fittingType="fit" className="h-8 w-8 shrink-0" />
      <div className="min-w-0 flex-1"><h1 className="truncate text-sm font-semibold">{projectsPage ? 'All projects' : project?.project_name || project?.answers?.business_name?.answer_text || 'Agent Studio'}</h1><p className="text-[10px] text-muted-foreground">{projectsPage ? 'Your saved work, in one place' : 'Agent chat + visual editor'}</p></div>
      <nav className="flex items-center gap-2" aria-label="Workspace pages">
        <Link to="/onboarding" className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs ${!projectsPage ? 'bg-secondary' : 'text-muted-foreground'}`}><PanelsTopLeft className="h-3.5 w-3.5" />Studio</Link>
        <Link to="/projects" className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs ${projectsPage ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}><FolderOpen className="h-3.5 w-3.5" />Projects</Link>
        <button aria-label="Sign out" onClick={() => base44.auth.logout('/login')} className="rounded-md p-2 text-muted-foreground hover:bg-secondary"><LogOut className="h-3.5 w-3.5" /></button>
      </nav>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2">
      <div className="max-w-full overflow-x-auto"><StudioSteps projectId={project?.id} /></div>
      {children && <div className="max-w-full overflow-x-auto">{children}</div>}
    </div>
  </header>;
}