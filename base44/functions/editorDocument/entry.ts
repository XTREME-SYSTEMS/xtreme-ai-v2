import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    if (!['read', 'save', 'replace'].includes(body.operation) || typeof body.project_id !== 'string' || !body.project_id.trim()) {
      return Response.json({ error: 'Provide operation (read, save, replace) and project_id.' }, { status: 400 });
    }
    const project = await base44.entities.OnboardingSession.get(body.project_id);
    if (!project || (project.user_email !== user.email && user.role !== 'admin')) return Response.json({ error: 'Project unavailable' }, { status: 403 });
    const revision = project.draft_revision || 0;
    let html = '';
    if (project.draft_file_uri) {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: project.draft_file_uri, expires_in: 120 });
      const response = await fetch(signed_url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Could not read the saved draft.');
      html = await response.text();
    } else {
      const query = { user_email: project.user_email, kind: 'web_pack' };
      if (project.draft_pack_id) query.id = project.draft_pack_id;
      else query.session_id = { $in: [project.id, project.session_id].filter(Boolean) };
      const page = await base44.entities.GptPack.filter(query, { sort: '-created_date', limit: 1 });
      html = page.items[0]?.preview_html || '';
    }
    if (body.operation === 'read') return Response.json({ project_id: project.id, name: project.project_name || project.answers?.business_name?.answer_text || 'Untitled project', revision, html, answers: project.answers || {} });
    if (!Number.isInteger(body.expected_revision) || body.expected_revision !== revision) return Response.json({ error: 'Draft changed. Read the latest document before saving.', revision }, { status: 409 });
    if (body.operation === 'replace') {
      if (typeof body.search !== 'string' || !body.search || typeof body.replacement !== 'string') return Response.json({ error: 'Provide a nonempty search string and replacement string.' }, { status: 400 });
      const index = html.indexOf(body.search);
      if (index < 0 || html.indexOf(body.search, index + body.search.length) >= 0) return Response.json({ error: 'Search must match exactly one document fragment. Read the current document first.' }, { status: 400 });
      html = html.slice(0, index) + body.replacement + html.slice(index + body.search.length);
    } else html = body.html;
    if (typeof html !== 'string' || !html.trim() || html.length > 500000) return Response.json({ error: 'Provide a nonempty HTML document under 500,000 characters.' }, { status: 400 });
    const latest = await base44.entities.OnboardingSession.get(project.id);
    if ((latest.draft_revision || 0) !== revision) return Response.json({ error: 'Another edit was saved. Read again before retrying.' }, { status: 409 });
    const file = new File([html], `studio-${project.id}-${revision + 1}.html`, { type: 'text/html' });
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    const data = { draft_file_uri: file_uri, draft_revision: revision + 1 };
    if (typeof body.name === 'string' && body.name.trim()) data.project_name = body.name.trim().slice(0, 160);
    await base44.entities.OnboardingSession.update(project.id, data);
    return Response.json({ success: true, project_id: project.id, revision: revision + 1, name: data.project_name || project.project_name, message: 'Draft saved. The visual editor will update automatically.' });
  } catch (error) {
    console.error('editorDocument:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}