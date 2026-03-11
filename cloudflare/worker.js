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

    if (url.pathname === '/intake' && request.method === 'POST') {
      return handleIntake(request, env);
    }

    if (url.pathname === '/loi/create' && request.method === 'POST') {
      return handleLoiCreate(request, env);
    }

    if (url.pathname === '/loi/skip' && request.method === 'POST') {
      return handleLoiSkip(request, env);
    }

    if (url.pathname === '/loi/status' && request.method === 'GET') {
      return handleLoiStatus(url, env);
    }

    return json({ ok: false, error: 'Not found' }, 404);
  },
};

async function handleIntake(request, env) {
  try {
    const payload = await parsePayload(request);
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

    const result = await env.INTAKE_DB.prepare(
      `INSERT INTO intake_submissions (
        name, company, email, team_size, pain, deployment, timeline, notes, source_page
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(name, company, email, teamSize, pain, deployment, timeline, notes, sourcePage)
      .run();

    return json({
      ok: true,
      message: 'Submission received',
      submissionId: result.meta?.last_row_id || null,
    }, 201);
  } catch (error) {
    return json({ ok: false, error: 'Server error', detail: String(error?.message || error) }, 500);
  }
}

async function handleLoiCreate(request, env) {
  try {
    const payload = await parsePayload(request);
    const submissionId = Number(payload.submissionId || payload.submission_id || 0);
    if (!submissionId) {
      return json({ ok: false, error: 'Missing submission id' }, 400);
    }

    const intake = await env.INTAKE_DB.prepare(
      `SELECT * FROM intake_submissions WHERE id = ? LIMIT 1`
    ).bind(submissionId).first();

    if (!intake) {
      return json({ ok: false, error: 'Submission not found' }, 404);
    }

    const existing = await env.INTAKE_DB.prepare(
      `SELECT * FROM loi_requests WHERE intake_submission_id = ? ORDER BY id DESC LIMIT 1`
    ).bind(submissionId).first();

    if (existing?.signing_url) {
      return json({
        ok: true,
        submissionId,
        loiRequestId: existing.id,
        status: existing.status,
        signingUrl: existing.signing_url,
        provider: 'docuseal',
        mode: 'existing',
      });
    }

    const templateId = env.DOCUSEAL_TEMPLATE_ID || 'DOCUSEAL_TEMPLATE_ID_NOT_SET';
    const publicBase = env.PUBLIC_SITE_URL || 'https://carapaceai.org';
    const fallbackUrl = `${publicBase}/loi-thank-you.html?submission=${submissionId}&provider=docuseal-pending`;

    let signingUrl = fallbackUrl;
    let docusealSubmissionId = null;
    let rawPayload = {
      mode: 'placeholder',
      message: 'Docuseal API not fully configured yet',
      templateId,
    };

    if (env.DOCUSEAL_API_URL && env.DOCUSEAL_API_KEY && env.DOCUSEAL_TEMPLATE_ID) {
      const response = await fetch(`${env.DOCUSEAL_API_URL.replace(/\/$/, '')}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': env.DOCUSEAL_API_KEY,
        },
        body: JSON.stringify({
          template_id: env.DOCUSEAL_TEMPLATE_ID,
          send_email: false,
          submitters: [
            {
              name: intake.name,
              email: intake.email,
              values: {
                signer_name: intake.name,
                signer_email: intake.email,
                company_name: intake.company || '',
                intended_use: intake.pain || '',
                deployment_interest: intake.deployment || '',
                timeline: intake.timeline || '',
                non_binding_notice: 'This letter of intent is non-binding and expresses interest only.',
              },
            },
          ],
        }),
      });

      rawPayload = await response.json().catch(() => ({ ok: false, error: 'Invalid Docuseal response' }));

      if (!response.ok) {
        return json({ ok: false, error: 'Docuseal request failed', detail: rawPayload }, 502);
      }

      docusealSubmissionId = rawPayload?.id || rawPayload?.submission_id || null;
      signingUrl = rawPayload?.embed_src || rawPayload?.link || rawPayload?.url || fallbackUrl;
    }

    const insert = await env.INTAKE_DB.prepare(
      `INSERT INTO loi_requests (
        intake_submission_id, signer_name, signer_email, company,
        docuseal_template_id, docuseal_submission_id, signing_url, status, raw_payload_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      submissionId,
      intake.name || '',
      intake.email || '',
      intake.company || '',
      templateId,
      docusealSubmissionId,
      signingUrl,
      env.DOCUSEAL_API_URL && env.DOCUSEAL_API_KEY && env.DOCUSEAL_TEMPLATE_ID ? 'sent' : 'pending_provider_setup',
      JSON.stringify(rawPayload)
    ).run();

    return json({
      ok: true,
      submissionId,
      loiRequestId: insert.meta?.last_row_id || null,
      status: env.DOCUSEAL_API_URL && env.DOCUSEAL_API_KEY && env.DOCUSEAL_TEMPLATE_ID ? 'sent' : 'pending_provider_setup',
      signingUrl,
      provider: 'docuseal',
      mode: env.DOCUSEAL_API_URL && env.DOCUSEAL_API_KEY && env.DOCUSEAL_TEMPLATE_ID ? 'live' : 'placeholder',
      nonBinding: true,
    });
  } catch (error) {
    return json({ ok: false, error: 'Server error', detail: String(error?.message || error) }, 500);
  }
}

async function handleLoiSkip(request, env) {
  try {
    const payload = await parsePayload(request);
    const submissionId = Number(payload.submissionId || payload.submission_id || 0);
    if (!submissionId) {
      return json({ ok: false, error: 'Missing submission id' }, 400);
    }

    const existing = await env.INTAKE_DB.prepare(
      `SELECT * FROM loi_requests WHERE intake_submission_id = ? ORDER BY id DESC LIMIT 1`
    ).bind(submissionId).first();

    if (existing) {
      await env.INTAKE_DB.prepare(
        `UPDATE loi_requests SET status = 'skipped', skipped_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(existing.id).run();
      return json({ ok: true, submissionId, skipped: true, loiRequestId: existing.id });
    }

    const intake = await env.INTAKE_DB.prepare(
      `SELECT * FROM intake_submissions WHERE id = ? LIMIT 1`
    ).bind(submissionId).first();

    if (!intake) {
      return json({ ok: false, error: 'Submission not found' }, 404);
    }

    const insert = await env.INTAKE_DB.prepare(
      `INSERT INTO loi_requests (
        intake_submission_id, signer_name, signer_email, company, status, skipped_at, raw_payload_json
      ) VALUES (?, ?, ?, ?, 'skipped', CURRENT_TIMESTAMP, ?)`
    ).bind(
      submissionId,
      intake.name || '',
      intake.email || '',
      intake.company || '',
      JSON.stringify({ source: 'thank-you-skip' })
    ).run();

    return json({ ok: true, submissionId, skipped: true, loiRequestId: insert.meta?.last_row_id || null });
  } catch (error) {
    return json({ ok: false, error: 'Server error', detail: String(error?.message || error) }, 500);
  }
}

async function handleLoiStatus(url, env) {
  try {
    const submissionId = Number(url.searchParams.get('id') || 0);
    if (!submissionId) {
      return json({ ok: false, error: 'Missing submission id' }, 400);
    }

    const intake = await env.INTAKE_DB.prepare(
      `SELECT id, name, company, email, pain, deployment, timeline FROM intake_submissions WHERE id = ? LIMIT 1`
    ).bind(submissionId).first();

    if (!intake) {
      return json({ ok: false, error: 'Submission not found' }, 404);
    }

    const loi = await env.INTAKE_DB.prepare(
      `SELECT * FROM loi_requests WHERE intake_submission_id = ? ORDER BY id DESC LIMIT 1`
    ).bind(submissionId).first();

    return json({
      ok: true,
      submissionId,
      intake,
      loi: loi || null,
      nonBinding: true,
    });
  } catch (error) {
    return json({ ok: false, error: 'Server error', detail: String(error?.message || error) }, 500);
  }
}

async function parsePayload(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await request.json();
  }
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  }
  throw new Error('Unsupported content type');
}

function clean(value) {
  if (value == null) return '';
  return String(value).trim().slice(0, 5000);
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://carapaceai.org',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
