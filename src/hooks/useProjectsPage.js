import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const settings = {
  OnboardingSession: { owner: 'user_email', search: ['project_name', 'answers.business_name.answer_text'], fields: ['project_name', 'answers', 'status', 'created_date', 'updated_date', 'draft_revision'] },
  GptPack: { owner: 'user_email', search: ['name'], fields: ['name', 'kind', 'status', 'session_id', 'created_date', 'updated_date'] },
  ClientProject: { owner: 'client_email', search: ['project_name', 'business_name'], fields: ['project_name', 'business_name', 'archived', 'created_date', 'updated_date'] }
};
export default function useProjectsPage(entity, email, search) {
  const [page, setPage] = useState({ items: [], has_more: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const config = settings[entity];
  const query = { [config.owner]: email };
  if (search.trim()) { const pattern = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); query.$or = config.search.map(field => ({ [field]: { $regex: pattern, $options: 'i' } })); }
  const loadMore = async () => {
    setLoading(true); setError('');
    try { const next = await base44.entities[entity].filter(query, { sort: '-updated_date', limit: 20, fields: config.fields, cursor: page.next_cursor }); setPage(prev => ({ ...next, items: [...prev.items, ...next.items] })); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    if (!email) return;
    let stopped = false;
    setLoading(true); setError('');
    const timeout = setTimeout(() => {
      base44.entities[entity].filter(query, { sort: '-updated_date', limit: 20, fields: config.fields }).then(next => { if (!stopped) setPage(next); }).catch(e => { if (!stopped) setError(e.message); }).finally(() => { if (!stopped) setLoading(false); });
    }, 200);
    return () => { stopped = true; clearTimeout(timeout); };
  }, [entity, email, search]);
  return { ...page, loading, error, loadMore };
}