require('dotenv/config');
const fetch = require('node-fetch');

const { BACKEND_URL, API_KEY } = process.env;
const POLL_INTERVAL_MS = 5000;

async function pollAndExecute() {
  try {
    const res = await fetch(`${BACKEND_URL}/agent/pending-actions`, {
      headers: { 'X-API-Key': API_KEY },
    });
    const actions = await res.json();

    for (const action of actions) {
      console.log(`[AGENT] Executing action ${action.id}: ${action.action_name}`);

      // SIMULATED execution — real infra calls (kubectl, AWS SDK, etc.)
      // would go here in a future, isolated change. For now we just
      // simulate success after a short delay, matching the plan's
      // MVP-depth note.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = {
        simulated: true,
        detail: `Simulated execution of "${action.action_name}" on ${action.args?.service ?? 'unknown service'}`,
      };

      const reportRes = await fetch(`${BACKEND_URL}/agent/actions/${action.id}/report`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed', result }),
      });

      if (reportRes.ok) {
        console.log(`[AGENT] Reported completion for ${action.id}`);
      } else {
        console.error(`[AGENT] Failed to report for ${action.id}:`, await reportRes.text());
      }
    }
  } catch (err) {
    console.error('[AGENT] Poll error:', err.message);
  }
}

console.log('[AGENT] Starting poll loop...');
setInterval(pollAndExecute, POLL_INTERVAL_MS);
pollAndExecute();