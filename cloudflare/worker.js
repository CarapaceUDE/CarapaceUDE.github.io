export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (url.pathname === '/health') {
      return json({ ok: true, service: 'carapace-intake' });
    }

    if (url.pathname !== '/intake') {
      return json({ ok: false, error: 'Not found' }, 404);
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405);
    }

    try {
      const contentType = request.headers.get('content-type') || '';
      let payload = {};

      if (contentType.includes('application/json')) {
        payload = await request.json();
      } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        payload = Object.fromEntries(formData.entries());
      } else {
        return json({ ok: false, error: 'Unsupported content type' }, 400);
      }

      const name = clean(payload.name);
      const company = clean(payload.company);
      const email = clean(payload.email);
      const teamSize = clean(payload['team-size'] ?? payload.team_size);
      const pain = clean(payload.pain);
      const deployment = clean(payload.deployment);
      const timeline = clean(payload.timeline);
      const notes = clean(payload.notes);
      const sourcePage = clean(payload.source_page || 'business.html');

      if (!name || !email || !pain) {
        return json({ ok: false, error: 'Missing required fields' }, 400);
      }

      await env.INTAKE_DB.prepare(
        `INSERT INTO intake_submissions (
          name, company, email, team_size, pain, deployment, timeline, notes, source_page
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(name, company, email, teamSize, pain, deployment, timeline, notes, sourcePage)
        .run();

      return json({ ok: true, message: 'Submission received' }, 201);
    } catch (error) {
      return json({ ok: false, error: 'Server error', detail: String(error?.message || error) }, 500);
    }
  },
};

function clean(value) {
  if (value == null) return '';
  return String(value).trim().slice(0, 5000);
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://carapaceai.org',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}
