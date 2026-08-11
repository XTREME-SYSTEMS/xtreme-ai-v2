import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Compares current vs previous keyword positions and creates RankAlert records
// for significant changes: entered page one, entered top 3, dropped 5+ positions,
// improved 5+ positions, lost ranking entirely, or first clicks detected.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const logs = [];
    const log = (m) => { logs.push(m); };

    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    } catch {}

    const svc = base44.asServiceRole;
    const keywords = await svc.entities.RankKeyword.list('-updated_date', 500);
    log(`Checking ${keywords.length} keywords for rank changes`);

    const alerts = [];
    const now = new Date().toISOString();

    for (const kw of keywords) {
      const curr = kw.current_position || 0;
      const prev = kw.previous_position || 0;

      // Skip if no position data
      if (curr === 0 && prev === 0) {
        // Check for new traffic (first clicks detected)
        if ((kw.clicks || 0) > 0 && kw.status !== 'ranking') {
          alerts.push({
            engine_id: kw.engine_id,
            keyword: kw.keyword,
            alert_type: 'new_traffic',
            position: curr,
            previous_position: prev,
            message: `First clicks detected for "${kw.keyword}" — ${kw.clicks} clicks, ${kw.impressions} impressions`
          });
        }
        continue;
      }

      // Entered page one (top 10)
      if (curr > 0 && curr <= 10 && (prev > 10 || prev === 0)) {
        alerts.push({
          engine_id: kw.engine_id,
          keyword: kw.keyword,
          alert_type: curr <= 3 ? 'top_three' : 'page_one',
          position: curr,
          previous_position: prev,
          message: `"${kw.keyword}" hit ${curr <= 3 ? 'TOP 3' : 'page one'} at position #${curr}!`
        });
        continue;
      }

      // Entered top 3 (from 4-10)
      if (curr > 0 && curr <= 3 && prev > 3) {
        alerts.push({
          engine_id: kw.engine_id,
          keyword: kw.keyword,
          alert_type: 'top_three',
          position: curr,
          previous_position: prev,
          message: `"${kw.keyword}" entered TOP 3 at position #${curr}!`
        });
        continue;
      }

      // Lost ranking entirely (was ranking, now 0)
      if (curr === 0 && prev > 0) {
        alerts.push({
          engine_id: kw.engine_id,
          keyword: kw.keyword,
          alert_type: 'lost_ranking',
          position: curr,
          previous_position: prev,
          message: `"${kw.keyword}" dropped out of top 100 (was #${prev})`
        });
        continue;
      }

      // Dropped 5+ positions
      if (curr > prev && (curr - prev) >= 5 && curr > 10) {
        alerts.push({
          engine_id: kw.engine_id,
          keyword: kw.keyword,
          alert_type: 'dropped',
          position: curr,
          previous_position: prev,
          message: `"${kw.keyword}" dropped ${curr - prev} positions (from #${prev} to #${curr})`
        });
        continue;
      }

      // Improved 5+ positions
      if (curr < prev && (prev - curr) >= 5 && curr > 0) {
        alerts.push({
          engine_id: kw.engine_id,
          keyword: kw.keyword,
          alert_type: 'improved',
          position: curr,
          previous_position: prev,
          message: `"${kw.keyword}" improved ${prev - curr} positions (from #${prev} to #${curr})`
        });
        continue;
      }
    }

    // Create alert records (bulk)
    if (alerts.length > 0) {
      await svc.entities.RankAlert.bulkCreate(alerts);
      log(`Created ${alerts.length} rank alerts`);
    } else {
      log('No significant rank changes detected');
    }

    return Response.json({
      ok: true,
      keywords_checked: keywords.length,
      alerts_created: alerts.length,
      alerts: alerts.slice(0, 20),
      logs
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}