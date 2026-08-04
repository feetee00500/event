# AGENT.md — Event TIRD QR Code Check-in

## 1. Product mission and scope

This repository is the operational system for **Event TIRD QR Code Check-in**.

- The event owner will create the real event, attendees, gates, tickets, and other records manually through the application.
- Do not add fake, demo, seed, placeholder, or fabricated event records to Production.
- Keep the product practical for an operations desk: clear status, fast scanning, short paths, and reliable feedback are more important than decorative UI.

When a request conflicts with this scope, preserve the Event TIRD/IIRFA 2026 context unless the user explicitly expands the product.

## 2. Current product decisions

The following decisions are intentional and should not be casually reverted:

- Demo activities and their dependent data were removed from both the Production and Preview databases during the initial setup work.
- **prisma/seed.ts** creates development users only. It must not create demo events, attendees, tickets, gates, check-ins, or fake audit history.
- The event experience starts with an empty state so the owner can create the real IIRFA 2026 event at **/admin/events/new**.
- Production and Preview/Development use separate database connections. Never assume that a Preview test can safely write to the Production database.
- The attendee administration screen supports add, edit, and delete/cancel actions. Delete is intentionally a safe cancellation flow that preserves check-in history and auditability.
- Desktop navigation and mobile bottom navigation are responsive alternatives, not duplicate controls displayed at the same breakpoint.
- Wide attendee tables switch to mobile cards rather than forcing horizontal page overflow.

## 3. Architecture

This is a single full-stack Next.js application:

- **Frontend:** React and TypeScript using the Next.js App Router.
- **Backend:** Next.js Route Handlers under **src/app/api**.
- **Authentication:** NextAuth Credentials provider and server-side session checks.
- **Authorization:** role and event-access checks on the server; client checks are for presentation only.
- **Data:** Prisma ORM with PostgreSQL, including Prisma Postgres/Vercel-managed connections.
- **Deployment:** one Vercel project serving the UI and API from the same deployment.

There is no separate frontend server and backend server in this repository. UI pages, server components, client components, Route Handlers, authentication, and database access are shipped together.

### Important directories

- **src/app/** — App Router pages, layouts, loading/error states, and API Route Handlers.
- **src/app/(auth)/** — authentication pages (login).
- **src/app/admin/** — desktop admin pages for event, user, attendee, ticket, gate, and report management.
- **src/app/scanner/** — mobile check-in scanner pages (device flow).
- **src/app/ticket/** — public QR ticket pass pages.
- **src/app/api/** — server endpoints; validate input and authorize here.
- **src/components/** — reusable UI and feature components.
- **src/lib/** — authentication, Prisma access, validation, QR/check-in logic, permissions, rate limiting, and shared utilities.
- **src/types/** — shared TypeScript declarations (e.g. NextAuth augmentation).
- **src/test/** — test utilities and fixtures.
- **prisma/schema.prisma** — database schema.
- **prisma/migrations/** — committed migration history.
- **prisma/seed.ts** — development-only user seed; no demo event data.
- **.agents/skills/** — project-scoped agent skills.
- **DESIGN.md** — the source of truth for the current visual direction and layout decisions.
- **docs/** — deployment and operational documentation; **docs/full-system-audit.md** is the full system audit report and **docs/vercel-deployment.md** is the GitHub + Vercel + Prisma Postgres runbook.

## 4. Design system and UI direction

**DESIGN.md** is the primary design reference. Keep the interface clean, current, and operational—not generic AI-generated dashboard UI (“AI slop”).

- Use the Event TIRD identity consistently. Do not introduce unrelated product names, event names, or logos.
- Preserve the navy/teal operational palette and strong contrast from the approved design.
- Prefer restrained surfaces, clear grouping, compact but readable information density, and deliberate whitespace.
- Use Lucide or the existing icon system for interface icons. Do not use emoji as structural icons.
- Status must never be communicated by color alone; include a text label, icon, or other readable cue.
- Keep labels and actions specific: “เพิ่มผู้เข้าร่วม”, “แก้ไข”, “ยกเลิกผู้เข้าร่วม”, “สร้างกิจกรรม”, and similar task-oriented language.
- Remove repeated headings, repeated navigation, duplicate action buttons, and decorative content that does not help an operator complete a task.
- Empty states must explain the next action. Do not fill an empty state with fake metrics or imaginary records.
- Use the existing component patterns before introducing a new one. Extend a shared component when the behavior is genuinely shared.

## 5. Mobile Safari and responsive rules

Mobile Safari is a first-class target. Test and reason about at least 375px, 430px, 768px, 1280px, and 1440px widths.

- Build mobile-first. Every page must remain usable on a narrow iPhone viewport without horizontal body overflow.
- Use **min-h-[100dvh]** or equivalent dynamic viewport sizing where the screen must fill the viewport; do not rely only on **100vh**.
- Respect **env(safe-area-inset-top)**, **env(safe-area-inset-bottom)**, and the existing safe-area utilities for fixed headers, bottom navigation, sheets, and full-screen surfaces.
- Keep interactive targets at least 44px in both dimensions where practical.
- Do not force small text for body copy or form controls; avoid iOS zoom behavior by keeping input text at 16px or larger.
- Apply **min-w-0**, wrapping, truncation, and bounded max widths to flex/grid children that can contain long emails, IDs, names, or labels.
- Use **overflow-x-hidden** only for page-level containment; do not hide content that the user must access.
- Horizontal scrolling is acceptable for intentionally scrollable tabs or compact data regions. It must be visually and semantically clear and must not make the whole page scroll sideways.
- On mobile, dense tables should become stacked cards or another readable layout. Do not shrink a table until it is unusable.
- Modals should behave as bottom sheets on small screens, use dynamic viewport max height, allow internal scrolling, preserve the close action, and respect bottom safe area.
- Fixed mobile navigation must not cover page content or primary form actions; reserve bottom padding in the shell.
- Avoid hover-only actions and hover-only explanations.

## 6. Authentication and permission model

The server is the source of truth for authorization. Never rely on hidden buttons, client state, or route visibility as the only access control.

Roles:

- **SUPER_ADMIN** — full system access.
- **EVENT_ADMIN** — manage assigned event data, including event settings, attendees, tickets, gates, reports, and attendee add/edit/delete actions.
- **EVENT_STAFF** — perform operational check-in actions within the assigned event.
- **VIEWER** — read-only access to permitted event data and reports.

Rules:

- Protect pages and every mutating API route on the server.
- Verify event ownership/assignment before reading or changing event-scoped records.
- Re-check permissions inside Route Handlers; do not trust IDs or role values supplied by the browser.
- Validate all request bodies with the shared validation layer in **src/lib/validation.ts** (or the current project equivalent).
- **DEV_AUTH_BYPASS** is for local development diagnosis only. It must be disabled/false for real deployments and must never be used as a production security mechanism.
- Do not put passwords, auth secrets, database URLs, or tokens in source, documentation, screenshots, logs, or commits.

## 7. Attendee administration contract

The attendee manager is the canonical UI for event-admin attendee operations:

- UI: **src/components/attendee/attendee-manager.tsx**
- Collection endpoint: **src/app/api/events/[eventId]/attendees/route.ts**
- Single-attendee endpoint: **src/app/api/events/[eventId]/attendees/[attendeeId]/route.ts**

Expected behavior:

- Add creates a validated attendee and the appropriate ticket record.
- Edit updates attendee details and the latest ticket type through the transaction-safe API.
- Delete is a deliberate cancel/deactivate action, not an irreversible physical deletion. It sets the attendee/ticket state to the project’s cancelled state, keeps check-in history, and records the audit event.
- Only authorized event administrators may mutate attendee data.
- Show useful success/error feedback and preserve the operator’s context after an action.
- Keep search, status filtering, import/export, select-all, and QR regeneration behavior intact unless the user explicitly changes the requirement.
- Keep the desktop table and mobile card views functionally equivalent.

Do not silently hard-delete a checked-in attendee or ticket. Historical check-in and audit data are part of the event record.

## 8. QR and check-in security

- Store and compare a QR token hash; do not persist raw QR tokens when the existing flow supports hashing.
- Never log raw QR tokens, credentials, database URLs, or session secrets.
- Keep check-in operations atomic and protect against duplicate/race-condition check-ins.
- Preserve audit logs for check-in, cancellation, attendee edits, and other sensitive actions.
- Keep request rate limits and abuse protections in place.
- Return safe, operator-friendly errors without leaking database or authentication internals.
- Treat all QR input as untrusted user input and validate it on the server.

## 9. Database, Prisma, and Vercel

Environment variable names are documented without values. Real values must exist only in local ignored env files or Vercel Environment Variables.

- The application reads the active PostgreSQL connection through **DATABASE_URL**.
- Vercel Production uses the Production database connection.
- Vercel Preview and Development use the non-production database connection so preview testing cannot alter live event data.
- Keep the environment mapping explicit when reconnecting a Vercel/Prisma Postgres integration.
- **prisma/migrations/** is source-controlled application history and must be included in GitHub before a deployment that needs schema changes.
- Use **npm run db:deploy** for applying committed migrations in deployment environments.
- Use **prisma migrate dev** only for local development when creating a new migration and after understanding the current schema.
- Never run **prisma migrate reset**, destructive database commands, or an unreviewed migration against Production.
- Use **npm run db:seed** only for local/development or explicitly isolated non-production data. The seed has a production guard.
- Do not use the seed to create demo events or fake attendees.
- A previously exposed database credential must be rotated in Prisma/Vercel and replaced in every environment. Do not copy the old value into documentation or commits.
- Never commit **.env**, **.env.***, **.vercel**, or generated credential files. Check **.gitignore** before adding environment tooling.
- Admin list pages bound attendee/ticket reads through **MAX_LIST_ROWS** in **src/lib/server-data.ts** and show a truncation notice; do not remove or raise the bound without a pagination UI.
- Import endpoints batch attendee status updates instead of updating per row; keep per-row transactions only for attendee + ticket creation.

### Safe database workflow

1. Inspect **prisma/schema.prisma** and existing migrations.
2. Make a focused schema change if required.
3. Generate and review the migration locally.
4. Run validation and tests against an isolated non-production database.
5. Apply committed migrations with **npm run db:deploy** in the target Vercel environment.
6. Verify the deployment and database connection through the application, logs, and a safe read-only check.

## 10. Common commands

Run from the repository root:

- **npm install**
- **npm run dev**
- **npm run typecheck**
- **npm run lint**
- **npm test**
- **npm run build**
- **npm run db:generate**
- **npm run db:validate**
- **npm run db:deploy**
- **npm run db:seed**

Use the package scripts already present in **package.json**; do not invent a second command convention. If a command requires network access, credentials, or an external service, state that clearly before running it.

## 11. Development workflow for agents

- Read the relevant existing files and **DESIGN.md** before editing.
- Preserve unrelated user changes and untracked files. Inspect **git status** before making changes.
- Prefer focused changes that follow existing naming, routing, and component conventions.
- Use the Edit/Write tools for file changes. Keep edits focused and verify the exact file afterward.
- Do not use broad destructive commands, reset the worktree, or delete user files without explicit scope and verification.
- Do not commit or push automatically. The owner decides when to review, commit, and push to **feetee00500/event.git**.
- Before committing, inspect untracked **.agents/**, **skills-lock.json**, and migration files; include only files intentionally owned by this project.
- Keep changes reversible and explain any data-affecting action.

## 12. Verification and handoff checklist

Before handing off a code change:

- [ ] **git diff --check** passes.
- [ ] **npm run typecheck** passes.
- [ ] **npm run lint** passes.
- [ ] **npm test** passes.
- [ ] **npm run build** passes, or any environment/build-lock limitation is explicitly reported.
- [ ] Empty states contain no fake event/activity data.
- [ ] Event admin can add, edit, and safely delete/cancel attendees.
- [ ] Server-side permissions are enforced for every mutation.
- [ ] Mobile layouts are checked at narrow iPhone widths and desktop widths.
- [ ] No body-level horizontal overflow is introduced; any horizontal tab scroll is intentional.
- [ ] Fixed navigation, modals, forms, and tables respect Safari safe areas and dynamic viewport height.
- [ ] No secrets or real credential values appear in the diff, logs, screenshots, or documentation.
- [ ] Database migrations are committed when schema changes are part of the release.
- [ ] Deployment environment variables point to the intended database.

The goal is a dependable Event TIRD operations tool: real data entered by authorized staff, clean responsive screens, secure QR check-in, and an auditable database history.

