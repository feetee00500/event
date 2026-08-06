# Cloudflare Workers deployment

This project uses Next.js App Router and is configured for Cloudflare Workers through OpenNext.

## Runtime and database

The application keeps PostgreSQL and Prisma. It does not migrate the schema to D1.

The Worker uses @prisma/adapter-pg with pg and the nodejs_compat compatibility flag. The Worker reads DATABASE_URL from the Cloudflare runtime context and creates a Prisma client for the request. Prisma migrations remain a Node/CI operation and are not run during a Worker request.

For higher traffic, configure Cloudflare Hyperdrive in front of the existing PostgreSQL database. When a HYPERDRIVE binding is added, the database helper can use its pooled connectionString; no Prisma schema change is required. Hyperdrive is optional for the first deployment.

## Cloudflare setup

1. Authenticate Wrangler:

   ~~~bash
   npx wrangler login
   ~~~

2. Set production secrets for the event-tird Worker:

   ~~~bash
   npx wrangler secret put DATABASE_URL
   npx wrangler secret put AUTH_SECRET
   npx wrangler secret put NEXTAUTH_URL
   npx wrangler secret put NEXT_PUBLIC_APP_URL
   npx wrangler secret put DEV_AUTH_BYPASS
   ~~~

   Set DEV_AUTH_BYPASS to false. Never enable the development authentication bypass in production.

3. Apply pending Prisma migrations from a controlled Node/CI environment that has the same PostgreSQL URL:

   ~~~bash
   npm run db:deploy
   ~~~

4. Build and deploy:

   ~~~bash
   npm run typecheck
   npm run build
   npm run deploy
   ~~~

npm run deploy builds the OpenNext bundle and then invokes Wrangler. The deployment target is defined in wrangler.jsonc.

## Local Cloudflare preview

Use .dev.vars or the existing local environment file for non-production values, then run:

~~~bash
npm run preview
~~~

This validates the OpenNext bundle and starts Wrangler's local Worker preview. Do not commit .dev.vars or any file containing database credentials.

## Limits and operational notes

- Cloudflare Workers Free is suitable for a smoke test, but the production baseline should be a Paid Workers plan because the Free plan has tighter CPU and bundle limits.
- Prisma Postgres Free is appropriate for evaluation/UAT. Use a paid database tier when production usage, storage, or operation volume requires it.
- The in-process check-in limiter is only a per-isolate safety net on Workers. Add a Cloudflare Rate Limiting rule for /api/checkin and /api/checkin/manual, or move the limiter state to a durable shared service before relying on it for abuse prevention.
- Keep uploads within the existing route limits. Large import/export workloads should be moved to an asynchronous job if they exceed Worker CPU or request limits.
- If the OpenNext build has platform-specific issues on Windows, run the same commands in Linux/WSL CI; the generated deployment artifacts are platform-independent.
