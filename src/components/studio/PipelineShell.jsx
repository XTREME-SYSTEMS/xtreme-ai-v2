import StudioTopBar from '@/components/studio/StudioTopBar';

// Unified dark pipeline shell — wraps every authenticated page so they all
// share the same branding (dark bg, blue accent) and the top step bar.
export default function PipelineShell({ children, actions }) {
  return (
    <div className="studio-workspace flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <StudioTopBar>{actions}</StudioTopBar>
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}