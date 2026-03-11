# Cloudflare intake backend

This folder contains the backend pieces for the business intake form.

## Files
- `worker.js` - Cloudflare Worker endpoint for `/intake`
- `schema.sql` - D1 schema for intake submissions
- `wrangler.toml.example` - Wrangler config template

## Expected setup
- Frontend remains on GitHub Pages at `https://carapaceai.org`
- Worker should be deployed on a Cloudflare route such as:
  - `https://api.carapaceai.org/intake`
- D1 binding name in the worker is `INTAKE_DB`

## Suggested deploy flow
1. Create a D1 database named `carapace-intake`
2. Apply `schema.sql`
3. Copy `wrangler.toml.example` to `wrangler.toml`
4. Fill in the real D1 `database_id`
5. Deploy the worker and route it to `api.carapaceai.org`

## Notes
- CORS is currently locked to `https://carapaceai.org`
- Required fields are: `name`, `email`, and `pain`
- Form source is tagged as `business.html`
