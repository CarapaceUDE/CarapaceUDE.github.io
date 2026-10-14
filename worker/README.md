# Workshop waitlist setup for Alex

The GitHub Pages form posts to `/api/waitlist`. A Cloudflare Worker on
`carapaceai.org/api/waitlist*` checks consent and Turnstile, then stores signups in
D1. The Worker also provides a private CSV export. Nothing in this directory has
been deployed or provisioned by this change.

## Local checks

Use Node.js 22 or newer. From the repository root:

```sh
cd worker
npm test
node --check src/index.js
```

Tests require no packages, Cloudflare account, or network. Worker tests mock D1
and Turnstile. Live setup and a real widget check are still required below.

## One-time setup and deployment

Run these steps yourself when ready. Commands below run from `worker/`.

1. Install Wrangler and authenticate:

   ```sh
   npm i -g wrangler
   npx wrangler login
   ```

2. Confirm `carapaceai.org` is an active zone in this Cloudflare account and its
   DNS record serving GitHub Pages is proxied through Cloudflare. The Worker
   route handles only `/api/waitlist*`; the rest of the site stays on GitHub
   Pages. The checked-in route covers the apex domain. If `www` serves the site
   directly instead of redirecting to the apex, add this second route to the
   `routes` array in `wrangler.toml` so its same-origin form also reaches the Worker:

   ```toml
   { pattern = "www.carapaceai.org/api/waitlist*", zone_name = "carapaceai.org" }
   ```

3. Create the database:

   ```sh
   wrangler d1 create carapace-waitlist
   ```

   Copy the returned `database_id` into `wrangler.toml`, replacing
   `D1_DATABASE_ID_PENDING`. Keep the binding name `DB`.

4. Apply the schema:

   ```sh
   wrangler d1 execute carapace-waitlist --remote --file=schema.sql
   ```

5. In the Cloudflare dashboard, open Turnstile and create a widget allowing
   `carapaceai.org` and `www.carapaceai.org`. Replace the single
   `TURNSTILE_SITE_KEY_PENDING` in `../workshops/index.html` with its public site
   key. Keep the widget secret for the next step. Do not use testing keys in
   production.

6. Store both secrets with Wrangler. Use the widget secret for `TURNSTILE_SECRET`
   and a unique randomly generated token (at least 32 random bytes, saved in
   your password manager) for `ADMIN_TOKEN`:

   ```sh
   wrangler secret put TURNSTILE_SECRET
   wrangler secret put ADMIN_TOKEN
   ```

   Enter values at the prompts. Do not put them in HTML, `wrangler.toml`, source
   files, or version control. The public site key is safe to put in HTML.

7. Deploy the Worker:

   ```sh
   wrangler deploy
   ```

   Publish the updated static workshop files through your usual GitHub Pages
   process after replacing the site key. This implementation does not publish
   either component for you.

## Verify after deployment

Open `https://carapaceai.org/workshops/`, complete the form and spam check, and
confirm the inline thank-you appears. Verify one row through the export below.
Submit the same email again with a new challenge to confirm only one row exists.

These curl examples use Bash syntax. On Windows use Git Bash, or adapt line
continuations and environment variables for PowerShell and call `curl.exe`.

Check the preflight:

```sh
curl -i -X OPTIONS https://carapaceai.org/api/waitlist \
  -H 'Origin: https://carapaceai.org' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

Expect 204 with the matching allowed origin. An unlisted origin receives 403.
For a real signup, obtain a fresh, unsubmitted token from the production widget
(the form's `cf-turnstile-response` hidden input). Tokens expire after five
minutes and are single-use. Do not submit the browser form with that same token.

```sh
read -r -s -p 'Fresh Turnstile token: ' TURNSTILE_TOKEN; echo
curl -i https://carapaceai.org/api/waitlist \
  -H 'Origin: https://carapaceai.org' \
  -H 'Accept: application/json' \
  --data-urlencode 'name=Alex Test' \
  --data-urlencode 'email=REPLACE_WITH_YOUR_EMAIL' \
  --data-urlencode 'consent=true' \
  --data-urlencode 'source=workshops-page' \
  --data-urlencode "cf-turnstile-response=$TURNSTILE_TOKEN"
unset TURNSTILE_TOKEN
```

Expect `{"ok":true}`. A duplicate returns `{"ok":true,"duplicate":true}` without
returning any stored personal details or changing the existing signup. Use a
fresh token for every attempt. Replace the Accept header with `Accept: text/html`
to test the 303 redirect to `/workshops/#thanks` after a successful form post.
JSON payloads are also accepted with `Content-Type: application/json` and a
boolean `consent: true`.

The native form works if the submission handler is unavailable and Turnstile has
provided a token. Turnstile itself requires JavaScript. Fully disabled JavaScript
cannot pass that check; the page provides an email alternative. There is no spam
check bypass in the native form path.

## Export signups

Download CSV with the admin token (kept out of shell history with a prompt):

```sh
read -r -s -p 'Admin token: ' ADMIN_TOKEN; echo
curl --fail-with-body https://carapaceai.org/api/waitlist/export.csv \
  -H "Authorization: Bearer $ADMIN_TOKEN" -o export.csv
unset ADMIN_TOKEN
```

Expect 401 without the correct bearer token. CSV includes column headers, quotes
and escapes every cell, and prefixes dangerous spreadsheet formula values with
an apostrophe. Export responses are marked `no-store`.

Alternatively, query D1 using your authenticated Cloudflare account:

```sh
wrangler d1 execute carapace-waitlist --remote --command "SELECT id, name, email, business_role, goals, consent, created_at, source FROM waitlist ORDER BY id" --json
```

Or export the complete database as SQL:

```sh
wrangler d1 export carapace-waitlist --remote --output=waitlist.sql
```

Keep downloaded signup data private. The default export filenames, local secrets,
and Wrangler state are ignored by `worker/.gitignore`.

## Behavior and limits

- Names are required (120 characters); emails must have a valid basic address
  shape (254 characters). Business/role is optional (200 characters), as are
  goals (2,000 characters). Strings are trimmed and oversized values rejected.
- Consent must be JSON `true` or form string `true`. Source defaults to
  `workshops-page`, the only allowed value. Email uniqueness is case insensitive
  using the requested SQLite `NOCASE` collation.
- A nonempty `_gotcha` silently succeeds without verification or a database write.
- Siteverify must accept the token and return an allowed hostname. Remote IP is
  forwarded only from `CF-Connecting-IP`. Token failures return 403; validation
  failures return 400; unexpected backend failures return a generic 500.
- CORS allows only the two configured origins. Requests with no Origin (such as
  curl) are permitted but still require Turnstile or export authentication.
  Unsupported methods on known endpoints return 405; unknown paths return 404.
- The admin token is compared with Node's constant-time `timingSafeEqual` over
  fixed-length SHA-256 digests. `nodejs_compat` enables that API in the Worker.

References: [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
and [D1 prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/).
