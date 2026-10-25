# OnCallOS

Autonomous incident resolution for on-call teams. When a monitoring alert fires, OnCallOS diagnoses the root cause, recommends an action, and, **only after the right level of human approval**, executes the fix. Nothing high-risk runs silently.

**Live app:** https://oncallos-frontend-v2.vercel.app · **API:** https://oncallos-backend.onrender.com · **Frontend repo:** https://github.com/kenesa8556/oncallos-frontend-v2

> The backend runs on Render's free tier, so the first request after idle can take ~30 s.

![Dashboard](docs/screenshots/dashboard.png)
![Show data: exact SQL and rows behind each number](docs/screenshots/show-data.png)
![Import wizard with dry-run review](docs/screenshots/import-wizard.png)

## How it works
1. **Alert in:** monitoring tools (e.g. Datadog) send a webhook to your organization's endpoint, authenticated with an API key.
2. **Diagnose:** an LLM analyzes the incident and produces a root cause, a recommended action, and a confidence level. <describe what context it uses>
3. **Risk gate:** each recommended action is classified against configurable risk rules. Low-risk actions can run automatically; **high-risk actions wait in the Approvals queue** until a human approves or denies them.
4. **Execute:** approved actions run against your infrastructure <e.g. Railway> using credentials stored encrypted per organization.
5. **Audit:** every diagnosis, decision and execution is recorded on the incident.

## Features
- Multi-tenant organizations with team management and roles
- Incident list and detail view with AI diagnosis and an incident chat
- Approvals queue with live pending count
- Configurable risk rules and execution settings
- Integrations: <Datadog webhooks>, per-org API keys
- In-app notifications and usage tracking
- Stripe subscriptions (billing portal, webhook-driven plan updates)

## Stack
- **Backend:** NestJS, TypeScript, Supabase (Postgres + Auth), Redis queue (<BullMQ on Upstash>), Stripe, <Gemini>. Hosted on Render, kept warm by UptimeRobot.
- **Frontend:** Next.js, Tailwind, Redux Toolkit (RTK Query). Hosted on Vercel.

## Security model
- Supabase auth (JWT) on every API call, plus an `X-Organization-Id` header checked against the caller's membership.
- Per-org data isolation <via RLS / query-level org filters>.
- Integration credentials encrypted at rest.
- Human approval required for high-risk actions.
- Stripe webhooks verified with signing secrets; CORS restricted to the deployed frontend.

## Run locally
```bash
git clone https://github.com/kenesa8556/oncallos-backend && cd oncallos-backend
npm ci
cp .env.example .env   # Supabase, Redis, Stripe, LLM and encryption keys
npm run start:dev
```

## Honest limits
- <Free hosting sleeps; uptime monitoring mitigates this>
- <Stripe is in test mode>
- <Which integrations/execution targets are supported and which are simulated>
- <No automated test/eval suite yet, if that's true>
- <Anything else you know is rough>