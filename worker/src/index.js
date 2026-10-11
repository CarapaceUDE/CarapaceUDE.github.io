import { createHash, timingSafeEqual } from 'node:crypto';

export const LIMITS = Object.freeze({ name: 120, email: 254, business_role: 200, goals: 2000 });
const SOURCES = ['workshops-page'];
const COLUMNS = ['id', 'name', 'email', 'business_role', 'goals', 'consent', 'created_at', 'source'];
const fail = (error) => ({ ok: false, error });

export function isHoneypot(input) {
  return typeof input?._gotcha === 'string' && input._gotcha.length > 0;
}

export function validateSignup(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail('Invalid form data.');
  if (isHoneypot(input)) return { ok: true, honeypot: true };
  const data = {};
  for (const [field, cap] of Object.entries(LIMITS)) {
    const value = input[field] ?? '';
    if (typeof value !== 'string') return fail(`Invalid ${field.replace('_', ' ')}.`);
    data[field] = value.trim();
    if (data[field].length > cap) return fail(`${field.replace('_', ' ')} must be ${cap} characters or fewer.`);
  }
  if (!data.name) return fail('Please enter your name.');
  if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(data.email)) return fail('Please enter a valid email address.');
  if (input.consent !== true && input.consent !== 'true') return fail('Please agree to receive workshop emails.');
  const token = input['cf-turnstile-response'];
  if (typeof token !== 'string' || !token.trim() || token.length > 2048) return fail('Please complete the spam check and try again.');
  data.consent = 1;
  data.source = SOURCES.includes(input.source) ? input.source : 'workshops-page';
  return { ok: true, data, token: token.trim() };
}

export function csvEscape(value) {
  let text = String(value ?? '');
  // Neutralize formulas, including ones preceded by whitespace/control characters.
  if (/^[\s\u0000-\u001f]*[=+@\-\uff1d\uff0b\uff0d\uff20]/u.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function toCsv(rows) {
  return COLUMNS.join(',') + '\r\n' + rows.map(row => COLUMNS.map(key => csvEscape(row[key])).join(',') + '\r\n').join('');
}

export function constantTimeEqual(candidate, expected) {
  // Hash to fixed-size buffers so token length does not short-circuit comparison.
  const hash = value => createHash('sha256').update(value).digest();
  return timingSafeEqual(hash(candidate), hash(expected));
}

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const origin = request.headers.get('Origin');
    const origins = allowedOrigins(env);
    const headers = new Headers({ 'Cache-Control': 'no-store', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff' });
    if (origin && origins.includes(origin)) headers.set('Access-Control-Allow-Origin', origin);
    const json = (body, status = 200) => {
      const responseHeaders = new Headers(headers);
      responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
      return new Response(JSON.stringify(body), { status, headers: responseHeaders });
    };
    if (path !== '/api/waitlist' && path !== '/api/waitlist/export.csv') return json(fail('Not found.'), 404);
    if (origin && !origins.includes(origin)) return json(fail('Origin is not allowed.'), 403);
    const exportRoute = path === '/api/waitlist/export.csv';
    const method = exportRoute ? 'GET' : 'POST';
    if (request.method === 'OPTIONS') {
      const requestedMethod = request.headers.get('Access-Control-Request-Method');
      const requestedHeaders = (request.headers.get('Access-Control-Request-Headers') || '').toLowerCase().split(',').map(value => value.trim()).filter(Boolean);
      if ((requestedMethod && requestedMethod !== method) || requestedHeaders.some(value => !['content-type', 'authorization', 'accept'].includes(value))) return json(fail('Preflight is not allowed.'), 403);
      headers.set('Access-Control-Allow-Methods', `${method}, OPTIONS`);
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== method) {
      headers.set('Allow', `${method}, OPTIONS`);
      return json(fail('Method not allowed.'), 405);
    }
    try {
      if (exportRoute) {
        const authorization = request.headers.get('Authorization') || '';
        const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
        if (!env.ADMIN_TOKEN || !constantTimeEqual(token, env.ADMIN_TOKEN)) {
          headers.set('WWW-Authenticate', 'Bearer');
          return json(fail('Unauthorized.'), 401);
        }
        const result = await env.DB.prepare(`SELECT ${COLUMNS.join(', ')} FROM waitlist ORDER BY id`).all();
        if (!result.success) throw new Error('Export failed');
        headers.set('Content-Type', 'text/csv; charset=utf-8');
        headers.set('Content-Disposition', 'attachment; filename="waitlist.csv"');
        return new Response(toCsv(result.results), { headers });
      }
      const contentType = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
      const formEncoded = contentType === 'application/x-www-form-urlencoded' || contentType === 'multipart/form-data';
      if (contentType !== 'application/json' && !formEncoded) return json(fail('Use JSON or form-encoded data.'), 400);
      let input;
      try {
        input = formEncoded ? Object.fromEntries(await request.formData()) : await request.json();
      } catch {
        return json(fail('Invalid form data.'), 400);
      }
      const success = (duplicate = false) => {
        if (formEncoded && !(request.headers.get('Accept') || '').toLowerCase().includes('application/json')) {
          headers.set('Location', '/workshops/#thanks');
          return new Response(null, { status: 303, headers });
        }
        return json(duplicate ? { ok: true, duplicate: true } : { ok: true });
      };
      const validated = validateSignup(input);
      if (!validated.ok) return json(validated, 400);
      if (validated.honeypot) return success();
      if (!env.TURNSTILE_SECRET) throw new Error('Missing spam check configuration');
      const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: validated.token, remoteip: request.headers.get('CF-Connecting-IP') || undefined }),
        signal: AbortSignal.timeout(10000)
      });
      if (!verification.ok) throw new Error('Spam check unavailable');
      const verified = await verification.json();
      const hostnames = origins.map(value => new URL(value).hostname);
      if (verified.success !== true || !hostnames.includes(verified.hostname)) return json(fail('The spam check failed. Please try again.'), 403);
      const { name, email, business_role, goals, consent, source } = validated.data;
      const result = await env.DB.prepare('INSERT INTO waitlist (name, email, business_role, goals, consent, source) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING')
        .bind(name, email, business_role, goals, consent, source).run();
      if (!result.success) throw new Error('Save failed');
      return success(result.meta.changes === 0);
    } catch {
      // Never return database errors, submitted details, or secrets to callers.
      return json(fail('We could not process your request. Please try again or email carapaceai@gmail.com for help.'), 500);
    }
  }
};
