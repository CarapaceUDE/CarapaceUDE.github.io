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

    if (url.pathname === '/loi/sign' && request.method === 'POST') {
      return handleLoiSign(request, env);
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
      `SELECT id, name, company, email, pain, deployment, timeline FROM intake_submissions WHERE id = ? LIMIT 1`
    ).bind(submissionId).first();

    if (!intake) {
      return json({ ok: false, error: 'Submission not found' }, 404);
    }

    const existing = await env.INTAKE_DB.prepare(
      `SELECT * FROM loi_requests WHERE intake_submission_id = ? ORDER BY id DESC LIMIT 1`
    ).bind(submissionId).first();

    if (!existing) {
      await env.INTAKE_DB.prepare(
        `INSERT INTO loi_requests (
          intake_submission_id, signer_name, signer_email, company, intended_use, timeline, status, raw_payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`
      ).bind(
        submissionId,
        intake.name || '',
        intake.email || '',
        intake.company || '',
        intake.pain || '',
        intake.timeline || '',
        JSON.stringify({ source: 'thank-you-continue' })
      ).run();
    } else if (existing.status === 'skipped') {
      await env.INTAKE_DB.prepare(
        `UPDATE loi_requests SET status = 'pending', skipped_at = NULL WHERE id = ?`
      ).bind(existing.id).run();
    }

    const publicBase = env.PUBLIC_SITE_URL || 'https://carapaceai.org';
    return json({
      ok: true,
      submissionId,
      signingUrl: `${publicBase}/loi.html?submission=${submissionId}`,
      mode: 'in_house',
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
        intake_submission_id, signer_name, signer_email, company, intended_use, timeline, status, skipped_at, raw_payload_json
      ) VALUES (?, ?, ?, ?, ?, ?, 'skipped', CURRENT_TIMESTAMP, ?)`
    ).bind(
      submissionId,
      intake.name || '',
      intake.email || '',
      intake.company || '',
      intake.pain || '',
      intake.timeline || '',
      JSON.stringify({ source: 'thank-you-skip' })
    ).run();

    return json({ ok: true, submissionId, skipped: true, loiRequestId: insert.meta?.last_row_id || null });
  } catch (error) {
    return json({ ok: false, error: 'Server error', detail: String(error?.message || error) }, 500);
  }
}

async function handleLoiSign(request, env) {
  try {
    const payload = await parsePayload(request);
    const submissionId = Number(payload.submissionId || payload.submission_id || 0);
    const signerName = clean(payload.signerName || payload.signer_name);
    const signerEmail = clean(payload.signerEmail || payload.signer_email);
    const company = clean(payload.company);
    const signerTitle = clean(payload.signerTitle || payload.signer_title);
    const intendedUse = clean(payload.intendedUse || payload.intended_use);
    const timeline = clean(payload.timeline);
    const typedSignature = clean(payload.typedSignature || payload.typed_signature);
    const drawnSignatureDataUrl = clean(payload.drawnSignatureDataUrl || payload.drawn_signature_data_url);
    const consentAuthorized = toBool(payload.consentAuthorized || payload.consent_authorized);
    const consentNonBinding = toBool(payload.consentNonBinding || payload.consent_non_binding);

    if (!submissionId || !signerName || !typedSignature || !consentAuthorized || !consentNonBinding) {
      return json({ ok: false, error: 'Missing required LOI fields' }, 400);
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

    const rawPayload = JSON.stringify({
      signerName,
      signerEmail,
      company,
      signerTitle,
      intendedUse,
      timeline,
      hasDrawnSignature: Boolean(drawnSignatureDataUrl),
    });

    if (existing) {
      await env.INTAKE_DB.prepare(
        `UPDATE loi_requests SET
          signer_name = ?,
          signer_email = ?,
          company = ?,
          signer_title = ?,
          intended_use = ?,
          timeline = ?,
          typed_signature = ?,
          drawn_signature_data_url = ?,
          consent_authorized = ?,
          consent_non_binding = ?,
          status = 'signed',
          completed_at = CURRENT_TIMESTAMP,
          raw_payload_json = ?
        WHERE id = ?`
      ).bind(
        signerName,
        signerEmail || intake.email || '',
        company || intake.company || '',
        signerTitle,
        intendedUse || intake.pain || '',
        timeline || intake.timeline || '',
        typedSignature,
        drawnSignatureDataUrl || '',
        consentAuthorized ? 1 : 0,
        consentNonBinding ? 1 : 0,
        rawPayload,
        existing.id
      ).run();

      return json({ ok: true, submissionId, loiRequestId: existing.id, status: 'signed' });
    }

    const insert = await env.INTAKE_DB.prepare(
      `INSERT INTO loi_requests (
        intake_submission_id, signer_name, signer_email, company, signer_title, intended_use, timeline,
        typed_signature, drawn_signature_data_url, consent_authorized, consent_non_binding,
        status, completed_at, raw_payload_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'signed', CURRENT_TIMESTAMP, ?)`
    ).bind(
      submissionId,
      signerName,
      signerEmail || intake.email || '',
      company || intake.company || '',
      signerTitle,
      intendedUse || intake.pain || '',
      timeline || intake.timeline || '',
      typedSignature,
      drawnSignatureDataUrl || '',
      consentAuthorized ? 1 : 0,
      consentNonBinding ? 1 : 0,
      rawPayload
    ).run();

    return json({ ok: true, submissionId, loiRequestId: insert.meta?.last_row_id || null, status: 'signed' });
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

    return json({ ok: true, submissionId, intake, loi: loi || null, nonBinding: true, mode: 'in_house' });
  } catch (error) {
    return json({ ok: false, error: 'Server error', detail: String(error?.message || error) }, 500);
  }
}

async function parsePayload(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return await request.json();
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  }
  throw new Error('Unsupported content type');
}

function clean(value) {
  if (value == null) return '';
  return String(value).trim().slice(0, 20000);
}

function toBool(value) {
  return value === true || value === 'true' || value === '1' || value === 1 || value === 'on';
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
