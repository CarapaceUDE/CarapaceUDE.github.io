import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { LIMITS, validateSignup, isHoneypot, csvEscape, toCsv, constantTimeEqual } from '../src/index.js';

const valid = (overrides = {}) => ({ name: 'Alex', email: 'alex@example.com', consent: true, 'cf-turnstile-response': 'test-token', ...overrides });

test('validation trims fields, preserves email, and restricts source', () => {
  const result = validateSignup(valid({ name: ' Alex ', email: ' Alex@Example.com ', business_role: ' Owner ', goals: ' Learn AI\n', source: 'untrusted' }));
  assert.equal(result.ok, true);
  assert.deepEqual(result.data, { name: 'Alex', email: 'Alex@Example.com', business_role: 'Owner', goals: 'Learn AI', consent: 1, source: 'workshops-page' });
  assert.equal(validateSignup(valid({ source: 'workshops-page', consent: 'true' })).ok, true);
});

test('required fields, email syntax, types, and explicit consent', () => {
  for (const input of [null, [], 'text', {}, valid({ name: '  ' }), valid({ name: 123 }), valid({ email: false }), valid({ goals: {} })]) assert.equal(validateSignup(input).ok, false);
  for (const email of ['', 'alex', '@example.com', 'a@@example.com', 'a@b', 'a @example.com', 'a@b..com', 'a@.com', 'a@example.com\nBcc:someone@example.com']) assert.equal(validateSignup(valid({ email })).ok, false, email);
  for (const consent of [false, 'false', 'yes', 'on', 1, '1', null, undefined]) assert.equal(validateSignup(valid({ consent })).ok, false);
});

test('field caps accept the boundary and reject overflow', () => {
  for (const [field, cap] of Object.entries(LIMITS)) {
    const boundary = field === 'email' ? 'a'.repeat(cap - 12) + '@example.com' : 'x'.repeat(cap);
    assert.equal(validateSignup(valid({ [field]: boundary })).ok, true, field);
    assert.equal(validateSignup(valid({ [field]: 'x' + boundary })).ok, false, field);
  }
  assert.equal(validateSignup(valid()).data.goals, '');
});

test('Turnstile token is required, typed, trimmed, and capped', () => {
  for (const token of [undefined, '', ' ', false, {}, 'x'.repeat(2049)]) assert.equal(validateSignup(valid({ 'cf-turnstile-response': token })).ok, false);
  assert.equal(validateSignup(valid({ 'cf-turnstile-response': 'x'.repeat(2048) })).ok, true);
  assert.equal(validateSignup(valid({ 'cf-turnstile-response': ' token ' })).token, 'token');
});

test('honeypot silently accepts any nonempty string before validating fields', () => {
  for (const value of ['bot', ' ']) {
    assert.equal(isHoneypot({ _gotcha: value }), true);
    assert.deepEqual(validateSignup({ _gotcha: value }), { ok: true, honeypot: true });
  }
  assert.equal(isHoneypot({ _gotcha: '' }), false);
  assert.equal(isHoneypot(null), false);
});

test('CSV quotes commas, quotes, newlines, nulls, and spreadsheet formulas', () => {
  assert.equal(csvEscape('a,"b"\r\nc'), '"a,""b""\r\nc"');
  assert.equal(csvEscape(null), '""');
  for (const value of ['=1+1', '+1', '-1', '@SUM(A1)', '  =1', '\t=1', '\r=1', '\ntext', '\u0000=1', '\uff1d1+1']) assert.equal(csvEscape(value), '"\'' + value + '"');
  assert.equal(csvEscape('Alex'), '"Alex"');
  const csv = toCsv([{ id: 1, name: '=1', email: 'a@example.com', consent: 1 }]);
  assert.equal(csv, 'id,name,email,business_role,goals,consent,created_at,source\r\n"1","\'=1","a@example.com","","","1","",""\r\n');
  assert.equal(toCsv([]).split('\r\n').length, 2);
});

test('constant-time comparison handles equal, unequal, Unicode and different lengths', () => {
  assert.equal(constantTimeEqual('secret', 'secret'), true);
  for (const value of ['', 'secre', 'secret-extra', 'Secret', 'sëcret']) assert.equal(constantTimeEqual(value, 'secret'), false);
});

function fixture() {
  const calls = [];
  const env = {
    ALLOWED_ORIGINS: 'https://carapaceai.org,https://www.carapaceai.org',
    TURNSTILE_SECRET: 'test-secret', ADMIN_TOKEN: 'test-admin',
    DB: { prepare(sql) {
      calls.push({ sql });
      return {
        bind(...values) { calls.at(-1).values = values; return this; },
        async run() { return { success: true, meta: { changes: 1 } }; },
        async all() { return { success: true, results: [{ id: 1, name: '=1+1', email: 'alex@example.com', consent: 1 }] }; }
      };
    } }
  };
  return { calls, env };
}

function request(body = valid(), options = {}) {
  const { headers, ...rest } = options;
  return new Request('https://carapaceai.org/api/waitlist', {
    method: 'POST', body: JSON.stringify(body), ...rest,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: 'https://carapaceai.org', ...headers }
  });
}

test('POST verifies token and client IP, binds fields, and returns success with CORS', async t => {
  const { env, calls } = fixture();
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), { secret: 'test-secret', response: 'test-token', remoteip: '192.0.2.1' });
    return Response.json({ success: true, hostname: 'carapaceai.org' });
  });
  const response = await worker.fetch(request(valid(), { headers: { 'CF-Connecting-IP': '192.0.2.1' } }), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://carapaceai.org');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.match(calls[0].sql, /ON CONFLICT\(email\) DO NOTHING/);
  assert.deepEqual(calls[0].values, ['Alex', 'alex@example.com', '', '', 1, 'workshops-page']);
});

test('honeypot has no verification or database side effects', async t => {
  const { env, calls } = fixture();
  const fetchMock = t.mock.method(globalThis, 'fetch', () => { throw new Error('Should not verify'); });
  const response = await worker.fetch(request({ _gotcha: 'bot' }), env);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(fetchMock.mock.callCount(), 0);
  assert.equal(calls.length, 0);
});

test('duplicate email succeeds without disclosing or updating existing records', async t => {
  const { env } = fixture();
  env.DB.prepare = () => ({ bind() { return this; }, async run() { return { success: true, meta: { changes: 0 } }; } });
  t.mock.method(globalThis, 'fetch', async () => Response.json({ success: true, hostname: 'carapaceai.org' }));
  const response = await worker.fetch(request(), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, duplicate: true });
});

test('form posts redirect only when JSON is not requested; multipart also works', async t => {
  const { env } = fixture();
  t.mock.method(globalThis, 'fetch', async () => Response.json({ success: true, hostname: 'carapaceai.org' }));
  for (const multipart of [false, true]) {
    for (const accept of ['text/html', 'application/json']) {
      const body = multipart ? new FormData() : new URLSearchParams();
      for (const [key, value] of Object.entries(valid())) body.set(key, String(value));
      const response = await worker.fetch(new Request('https://carapaceai.org/api/waitlist', { method: 'POST', headers: { Accept: accept }, body }), env);
      assert.equal(response.status, accept === 'text/html' ? 303 : 200);
      if (response.status === 303) assert.equal(response.headers.get('Location'), '/workshops/#thanks');
      else assert.deepEqual(await response.json(), { ok: true });
    }
  }
  const trapped = await worker.fetch(new Request('https://carapaceai.org/api/waitlist', { method: 'POST', body: new URLSearchParams({ _gotcha: 'bot' }) }), env);
  assert.equal(trapped.status, 303);
});

test('invalid payloads and rejected origins never write', async () => {
  const { env, calls } = fixture();
  for (const req of [request(valid({ consent: false })), request(null), request(valid(), { body: '{' }), request(valid(), { headers: { 'Content-Type': 'text/plain' } })]) assert.equal((await worker.fetch(req, env)).status, 400);
  for (const origin of ['https://evil.example', 'null', 'https://carapaceai.org.evil.example']) {
    const response = await worker.fetch(request(valid(), { headers: { Origin: origin } }), env);
    assert.equal(response.status, 403);
    assert.equal(response.headers.has('Access-Control-Allow-Origin'), false);
  }
  assert.equal(calls.length, 0);
});

test('failed verification, wrong host, outages and database failures fail closed', async t => {
  const { env, calls } = fixture();
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ success: false }));
  assert.equal((await worker.fetch(request(), env)).status, 403);
  mock.mock.mockImplementation(async () => Response.json({ success: true, hostname: 'evil.example' }));
  assert.equal((await worker.fetch(request(), env)).status, 403);
  mock.mock.mockImplementation(async () => { throw new Error('private upstream detail'); });
  const outage = await worker.fetch(request(), env);
  assert.equal(outage.status, 500);
  assert.doesNotMatch(await outage.text(), /private upstream detail/);
  mock.mock.mockImplementation(async () => new Response('', { status: 500 }));
  assert.equal((await worker.fetch(request(), env)).status, 500);
  assert.equal(calls.length, 0);
  mock.mock.mockImplementation(async () => Response.json({ success: true, hostname: 'carapaceai.org' }));
  env.DB.prepare = () => { throw new Error('SQL private detail'); };
  const dbFailure = await worker.fetch(request(), env);
  assert.equal(dbFailure.status, 500);
  assert.doesNotMatch(await dbFailure.text(), /SQL private detail/);
  delete env.TURNSTILE_SECRET;
  assert.equal((await worker.fetch(request(), env)).status, 500);
});

test('routing, method checks, and restricted preflight', async () => {
  const { env } = fixture();
  for (const path of ['/other', '/api/waitlist-evil', '/api/waitlist/']) assert.equal((await worker.fetch(new Request('https://carapaceai.org' + path), env)).status, 404);
  const wrongMethod = await worker.fetch(new Request('https://carapaceai.org/api/waitlist'), env);
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get('Allow'), 'POST, OPTIONS');
  const preflight = headers => new Request('https://carapaceai.org/api/waitlist', { method: 'OPTIONS', headers });
  const response = await worker.fetch(preflight({ Origin: 'https://www.carapaceai.org', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' }), env);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://www.carapaceai.org');
  assert.equal((await worker.fetch(preflight({ 'Access-Control-Request-Method': 'DELETE' }), env)).status, 403);
  assert.equal((await worker.fetch(preflight({ 'Access-Control-Request-Headers': 'x-unknown' }), env)).status, 403);
});

test('export requires bearer authentication and returns formula-safe CSV', async () => {
  const { env, calls } = fixture();
  const exportRequest = token => new Request('https://carapaceai.org/api/waitlist/export.csv', { headers: token ? { Authorization: token } : {} });
  for (const token of [undefined, 'Bearer wrong', 'Basic test-admin', 'Bearer test-admin-extra']) {
    const response = await worker.fetch(exportRequest(token), env);
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('WWW-Authenticate'), 'Bearer');
  }
  assert.equal(calls.length, 0);
  const response = await worker.fetch(exportRequest('Bearer test-admin'), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'text/csv; charset=utf-8');
  assert.match(response.headers.get('Content-Disposition'), /attachment/);
  assert.match(await response.text(), /"'=1\+1"/);
  delete env.ADMIN_TOKEN;
  assert.equal((await worker.fetch(exportRequest('Bearer test-admin'), env)).status, 401);
});
