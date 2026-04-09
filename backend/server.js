// MVP: /forms/:id/score - deterministic response; no LLMS MVP
app.post('/forms/:id/score', async (req) => {
  const formId = req.params.id;
  const request_id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const leadScore = 60;
  const qualityTier = 'warm';
  const routing_destination = 'routing_destination_warm';
  try {
    const dbOk = await isConnected();
    if (dbOk) {
      await query(
        `INSERT INTO agent_logs (form_id, agent_action, input, output, status)
         VALUES ($1, 'score_lead', $2, $3, 'success')`,
        [formId, JSON.stringify({ values: req.body?.values ?? {} }), JSON.stringify({ leadScore, qualityTier, routing_destination })]
      ).catch(() => {});
      await query(
        `UPDATE submissions SET lead_score = $1, quality_tier = $2, routing_destination = $3, qualified = $4
         WHERE form_id = $5 AND created_at > NOW() - INTERVAL '1 minute'`,
        [leadScore, qualityTier, routing_destination, leadScore >= 50, formId]
      ).catch(() => {});
    }
  } catch {
    // ignore db errors in MVP
  }
  return { ok: true, lead_score: leadScore, quality_tier: qualityTier, routing_destination: routing_destination, request_id };
});
