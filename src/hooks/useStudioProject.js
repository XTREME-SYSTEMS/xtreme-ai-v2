import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function useStudioProject() {
  const location = useLocation();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let stopped = false;
    const init = async () => {
      setLoading(true); setError(''); setHtml('');
      try {
        const me = await base44.auth.me();
        const params = new URLSearchParams(location.search);
        let current;
        if (params.get('project')) {
          const page = await base44.entities.OnboardingSession.filter({ id: params.get('project'), user_email: me.email }, { limit: 1 });
          current = page.items[0];
          if (!current) throw new Error('This project is unavailable. Open a project from Projects.');
        } else if (params.get('pack')) {
          const page = await base44.entities.GptPack.filter({ id: params.get('pack'), user_email: me.email }, { limit: 1 });
          const pack = page.items[0];
          if (!pack) throw new Error('This website pack is unavailable.');
          const matches = await base44.entities.OnboardingSession.filter({ user_email: me.email, $or: [{ draft_pack_id: pack.id }, { id: pack.session_id || '' }, { session_id: pack.session_id || '__unlinked__' }] }, { limit: 1 });
          current = matches.items[0];
          if (current) current = await base44.entities.OnboardingSession.update(current.id, { draft_pack_id: pack.id });
          else current = await base44.entities.OnboardingSession.create({ user_email: me.email, status: 'onboarding', current_step: 0, answers: {}, project_name: pack.name, draft_pack_id: pack.id });
        } else if (!params.has('new')) {
          const page = await base44.entities.OnboardingSession.filter({ user_email: me.email }, { sort: '-updated_date', limit: 1 });
          current = page.items[0];
        }
        if (!current) current = await base44.entities.OnboardingSession.create({ user_email: me.email, status: 'onboarding', current_step: 0, answers: {}, project_name: 'Untitled project' });
        if (stopped) return;
        setUser(me); setProject(current);
        if (!params.get('project')) navigate(`/onboarding?project=${current.id}`, { replace: true });
      } catch (e) { if (!stopped) setError(e.message); }
      finally { if (!stopped) setLoading(false); }
    };
    init();
    return () => { stopped = true; };
  }, [location.search, navigate]);
  useEffect(() => {
    if (!project?.id) return;
    return base44.entities.OnboardingSession.subscribe(event => {
      if (event.id === project.id && event.type === 'update') setProject(prev => ({ ...prev, ...event.data }));
    });
  }, [project?.id]);
  useEffect(() => {
    if (!project?.id) return;
    let stopped = false;
    setDocumentLoading(true);
    base44.functions.invoke('editorDocument', { operation: 'read', project_id: project.id }).then(({ data }) => {
      if (!stopped) { setHtml(data.html || ''); setError(''); }
    }).catch(e => { if (!stopped) setError(e.response?.data?.error || e.message); }).finally(() => { if (!stopped) setDocumentLoading(false); });
    return () => { stopped = true; };
  }, [project?.id, project?.draft_revision, project?.draft_pack_id]);
  const save = useCallback(async document => {
    if (!project) return false;
    setSaving(true); setError('');
    try {
      const { data } = await base44.functions.invoke('editorDocument', { operation: 'save', project_id: project.id, expected_revision: project.draft_revision || 0, html: document });
      setProject(prev => ({ ...prev, draft_revision: data.revision }));
      setHtml(document); return true;
    } catch (e) { setError(e.response?.data?.error || e.message); return false; }
    finally { setSaving(false); }
  }, [project]);
  return { project, setProject, user, html, loading, documentLoading, error, saving, save };
}