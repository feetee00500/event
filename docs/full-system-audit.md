# Full System Audit — Event TIRD QR Code Check-in

วันที่ตรวจ: 2026-08-03 (Asia/Bangkok)

Repository: D:\code internal TIRD\Event-Tird

Design source ใหม่: D:\code internal TIRD\time worker\design.md (Vercel-inspired token system, 776 บรรทัด)

ขอบเขต: ตรวจ repository ปัจจุบันทั้ง UI, route, API, Prisma schema, auth, QR/check-in, validation, timezone, security, performance, deployment, Docker/Vercel readiness, documentation และ Browser smoke test

ข้อจำกัด: root นี้ไม่มี .git จึงไม่สามารถยืนยัน commit/base revision ได้; ไม่มี DATABASE_URL ใน environment; ไม่มีฐานข้อมูลสำหรับ UAT หรือ concurrent check-in semantic จริง; Browser environment ใช้ viewport 1280 x 720 เท่านั้นและไม่มีอุปกรณ์กล้องจริง

## Executive Summary

ระบบมีโครงสร้าง Next.js/Prisma และเส้นทางหลักของ Event TIRD ครบพอสำหรับเป็น functional prototype: สร้าง Event, รายชื่อผู้เข้าร่วม, ออก Ticket/QR, Scanner, Gate, Check-in history, reports และ user management มี code path จริง ไม่พบ mock data ใน production route หลัก ยกเว้น development auth bypass และ seed fixtures

สถานะปัจจุบันยังไม่พร้อม UAT หรือ production เพราะไม่มี migration lifecycle, ไม่มี DATABASE_URL ใน environment ที่ตรวจ, ไม่มีการทดสอบฐานข้อมูลจริงและ concurrent check-in, มีความเสี่ยงด้าน auth/seed/report authorization, และ access mode MULTI_DAY/REENTRY ให้ความหมายเกินกว่าที่ backend รองรับ

Build quality ดี: npm install, typecheck, lint, test และ build ผ่านเมื่อรันใน environment ที่อนุญาตให้ Vitest/esbuild สร้าง process; production dependency audit เป็น 0 vulnerabilities. อย่างไรก็ตาม build ผ่านไม่ใช่หลักฐานว่า data flow, authorization, migration หรือ camera flow ใช้จริงได้

ข้อสรุปเชิงสถาปัตยกรรม: ไม่ควร rewrite ระบบใหม่ ทางเลือกที่เหมาะสมกว่าคือ harden domain/DB/auth ให้ผ่าน P0/P1 ก่อน จากนั้นปรับ UI ด้วย token layer ของ design ใหม่และรักษา domain เดิมไว้

## Post-audit Deployment Preparation

หลังสร้างรายงาน audit มีการเตรียม repository สำหรับ GitHub/Vercel แบบ local-only:

- เพิ่ม .gitignore เพื่อกัน node_modules, .next, .env*, .vercel และ logs ไม่ให้ขึ้น GitHub
- เพิ่ม package script postinstall: prisma generate เพื่อให้ Vercel generate Prisma Client ทุก install
- เพิ่ม package script db:deploy: prisma migrate deploy สำหรับ release migration step
- เพิ่ม docs/vercel-deployment.md เป็น runbook GitHub + Vercel + Prisma Postgres
- ยังไม่มี git init/remote/commit/push, ยังไม่มี prisma/migrations และยังไม่ได้รัน migration กับฐานข้อมูลจริง
- หลังการเตรียมนี้ npm install, npm audit, typecheck, lint, test (4 files/8 tests) และ build ผ่าน
## Current System Status

| Area | สถานะ | หลักฐาน |
|---|---|---|
| Framework | PASS | Next.js 15.5.22, TypeScript, Prisma 6.19.3 |
| Install | PASS | npm install ผ่าน; package lock ไม่เปลี่ยนจากการตรวจ |
| Typecheck | PASS | npm run typecheck |
| Lint | PASS | npm run lint |
| Unit tests | PASS | 4 test files, 8 tests ผ่าน |
| Build | PASS | npm run build ผ่าน; มี warning เรื่อง Next.js ESLint plugin |
| Prisma generate | PASS | npm run db:generate ผ่านหลังหยุด dev server |
| Prisma validate | BLOCKED | P1012: Environment variable DATABASE_URL ไม่พบ |
| Prisma migrate status | BLOCKED | P1012 เดียวกัน และไม่มี prisma/migrations |
| Real database | NOT TESTED | ไม่มี DATABASE_URL/DB |
| Real auth | NOT TESTED | Browser อยู่ใน development auth bypass |
| Real QR check-in | NOT TESTED | ไม่มี DB และ ticket จริง |
| Concurrent check-in | BLOCKED | ส่ง HTTP probe 10 requests พร้อมกันแล้วได้ 10 x 500 จาก DATABASE_URL missing; ยังสรุป race/idempotency ไม่ได้ |
| Browser dashboard | PASS WITH DEV DATA | /admin/dashboard render จริงด้วย zero-state dev fallback |
| Browser event list/scanner | BLOCKED WITH MESSAGE | แสดง error ที่อธิบายว่า DATABASE_URL ยังไม่พร้อม |
| Browser public ticket | FAIL WITHOUT DB | /ticket/[token] โยน PrismaClientInitializationError เมื่อ query DB |
| Mobile/camera matrix | NOT TESTED | Browser tool ไม่มี viewport resize และไม่มี camera device |
| Git baseline | UNKNOWN | root ไม่มี .git |

## UAT Readiness

สถานะ: NOT READY

เหตุผลที่เป็น blocker:

- UAT environment ปัจจุบันไม่มี DATABASE_URL จึงสร้าง Event/attendee/ticket/check-in จริงไม่ได้
- ไม่มี migration baseline/deploy/rollback path
- ยังไม่มีผล concurrent check-in ที่พิสูจน์ว่า scan ซ้ำพร้อมกันไม่สร้างผลลัพธ์ผิด
- development auth bypass ทำให้ผล login/role UAT ไม่ใช่ production-like
- MULTI_DAY ยังเป็นตัวเลือกใน UI แต่ไม่มี day/session model
- REENTRY ทำให้ report นับ successful scans เป็นจำนวนครั้ง ไม่ใช่จำนวนผู้เข้าร่วม
- ไม่ได้ทดสอบ camera บน HTTPS หรือ mobile viewport จริง

## Production Readiness

สถานะ: NOT READY

Production blocker หลักคือ P0-001, P0-002 และ P1-001 ถึง P1-007 ตาม findings register ด้านล่าง โดยเฉพาะ migration, env contract, auth hardening, report authorization, QR lifecycle และ access-mode semantics

## Feature Inventory

นับ 1 รายการต่อ feature cluster; สถานะสะท้อน code path ที่พบ ไม่ใช่การรับรอง production correctness

สรุป: COMPLETE 4, PARTIAL 29, MISSING 11, BACKEND_ONLY 4, UI_ONLY 1, BROKEN 1, MOCKED 2, NOT_TESTED 3 (รวม 55 รายการ)

| # | Feature | สถานะ | ขอบเขต/หมายเหตุ |
|---:|---|---|---|
| 1 | Event TIRD / IIRFA 2026 branding | COMPLETE | มี branding.ts และใช้ใน shell/layout/dashboard |
| 2 | Login credentials | PARTIAL | NextAuth credentials มีจริง แต่ bypass/default env และ brute-force gap |
| 3 | Active session re-check | COMPLETE | server re-query user และ isActive |
| 4 | Development auth bypass | MOCKED | ใช้ dev user/zero data เมื่อไม่มี DB |
| 5 | RBAC + event assignment scope | PARTIAL | mutation หลัก guard แล้ว แต่ report/read UI mismatch |
| 6 | Dashboard metrics | PARTIAL | DB query จริง; no-DB ใช้ zero fallback; timezone วันนี้ไม่คงที่ |
| 7 | Dashboard recent check-ins | UI_ONLY | UI ระบุว่าจะใช้ข้อมูลจริง แต่ page ไม่ query/use getCheckins |
| 8 | Event list/filter | PARTIAL | query จริง แต่ไม่มี pagination และ no-DB error |
| 9 | Create Event | PARTIAL | form/API/transaction มีจริง; จำกัด event แบบ global และ raceable |
| 10 | Edit Event | PARTIAL | update จริง; status transition ไม่ถูกจำกัด |
| 11 | Cancel Event | PARTIAL | soft-cancel จริง; audit แยก transaction |
| 12 | Public event page | MISSING | ไม่มี /events/[eventId] |
| 13 | Add attendee + initial ticket | PARTIAL | transaction จริง; raw public token ถูกคืนจาก API |
| 14 | Edit attendee | BACKEND_ONLY | API มี แต่ไม่มี UI action |
| 15 | Cancel attendee | BACKEND_ONLY | API soft-cancel มี แต่ไม่มี UI action |
| 16 | CSV/XLSX import | PARTIAL | import row-by-row และ partial success; limit/duplicate gap |
| 17 | Attendee export | COMPLETE | XLSX response และ safeCell กัน formula injection |
| 18 | Import template | COMPLETE | CSV template route จริง |
| 19 | Attendee search/filter | PARTIAL | client filter/endpoint filter มี แต่ข้อมูลจำกัดและไม่ paginate |
| 20 | Attendee/ticket pagination | MISSING | server data บาง route ไม่จำกัดจำนวน; history/report cap แบบ hard-coded |
| 21 | Bulk ticket generation | PARTIAL | สร้างจริงและ invalidate ticket เก่า; ไม่มี delivery/history |
| 22 | Public QR ticket pass | PARTIAL | token hash/QR จริง แต่ privacy/cache/error boundary ยังไม่พร้อม |
| 23 | Regenerate QR | PARTIAL | token ใหม่จริง แต่ไม่ clear expiresAt และไม่มี history |
| 24 | Cancel/reactivate ticket | PARTIAL | mutation จริง แต่ state rules/expiry/transaction ไม่ครบ |
| 25 | Ticket history/delivery status | MISSING | ไม่มี TicketHistory หรือ DeliveryStatus |
| 26 | Gate create/edit/toggle | PARTIAL | API/UI จริง; ไม่มี delete/device assignment/capacity |
| 27 | Gate delete/device assignment | MISSING | ไม่มี handler/UI |
| 28 | Scanner camera | PARTIAL | ZXing dynamic import/camera switch มี; ยังไม่ทดสอบ device/HTTPS |
| 29 | Manual ticket check-in | PARTIAL | API/UI จริง; rate response ไม่มี Retry-After |
| 30 | Torch/fullscreen/device status | PARTIAL | มี fallback; device id fallback เป็น browser และไม่ persist generated UUID |
| 31 | Single-entry check-in | PARTIAL | conditional update/transaction มี; ยังไม่มี DB concurrency proof |
| 32 | REENTRY | PARTIAL | อนุญาตหลาย success logs แต่ report/dashboard นับ logs |
| 33 | MULTI_DAY | MISSING | enum/UI มี แต่ไม่มี EventDay/session/date uniqueness |
| 34 | Check-in history | PARTIAL | query จริง แต่ take 100 และไม่มี pagination/export |
| 35 | Reports metrics | PARTIAL | query จริง; counts ผิดเชิง semantics สำหรับ REENTRY |
| 36 | Report export button | BROKEN | ปุ่ม Export ของ report เรียก attendee export |
| 37 | User CRUD/role/active | PARTIAL | super admin API/UI มี; ไม่มี reset/password lifecycle/final admin guard |
| 38 | Event assignment UI | BACKEND_ONLY | upsert API มี; UI ไม่จัดการ assignment |
| 39 | Audit write | BACKEND_ONLY | mutation หลาย route เขียน log; ไม่มี audit read UI |
| 40 | Audit review/export | MISSING | permission มีแต่ไม่มีหน้าตรวจสอบ |
| 41 | Bangkok display timezone | PARTIAL | formatter คงที่ แต่ dashboard day boundary/local input มี gap |
| 42 | Check-in rate limiting | PARTIAL | in-memory เฉพาะ check-in; ไม่ distributed และไม่ครอบ login |
| 43 | Error/empty states | PARTIAL | หลายหน้ามี InlineNotice; generic DB/P2025 path ยังไม่ดี |
| 44 | Responsive app shell | PARTIAL | mobile nav/table scroll มี; ไม่มี device matrix จริง |
| 45 | Accessibility forms | PARTIAL | focus/modal/aria บางส่วนดี; Field ไม่ผูก htmlFor |
| 46 | Offline queue/retry | MISSING | มี offline message แต่ไม่ queue/reconcile |
| 47 | Image upload/object storage | MISSING | รับ imageUrl เท่านั้น ไม่มี storage/upload policy |
| 48 | Health/readiness | MISSING | ไม่มี /api/health หรือ /api/ready |
| 49 | Prisma migration lifecycle | MISSING | ไม่มี prisma/migrations |
| 50 | Docker/Vercel production setup | MISSING | ไม่มี Dockerfile/compose/vercel config/standalone contract |
| 51 | Seed fixtures | MOCKED | development fixture ใช้ password คงที่และ create event ใหม่ทุก seed |
| 52 | New Vercel-inspired design system | PARTIAL | มี design source ใหม่ แต่ยังไม่ได้ map ลง token/component layer |
| 53 | Real DB UAT roles | NOT_TESTED | ไม่มี DB/credentials |
| 54 | Real camera/browser matrix | NOT_TESTED | ไม่มี device/viewport runner ใน environment นี้ |
| 55 | Concurrent check-in test | NOT_TESTED | ยิง HTTP probe 10 requests ได้ 10 x 500 เพราะไม่มี DB; semantic assertion ยังไม่ทำ |

## Route Inventory

### UI Routes

| Route | Auth/data path | สถานะ audit |
|---|---|---|
| / | redirect ตาม auth | CONNECTED |
| /login | NextAuth login form | CONNECTED; dev bypass redirect ไป dashboard |
| /admin/dashboard | getDashboardData | CONNECTED; zero fallback และ recent scan UI-only |
| /admin/events | getEvents | CONNECTED; no-DB notice |
| /admin/events/new | EventForm → POST /api/events | CONNECTED; submit DB ไม่ได้ทดสอบ |
| /admin/events/[eventId] | getEvent + metrics/gates | CONNECTED; dynamic DB not tested |
| /admin/events/[eventId]/edit | EventForm → PATCH | CONNECTED; status transition gap |
| /admin/events/[eventId]/attendees | getAttendees + AttendeeManager | CONNECTED; no pagination |
| /admin/events/[eventId]/tickets | getTickets + TicketManager | CONNECTED; lifecycle gap |
| /admin/events/[eventId]/gates | getEvent + GateManager | CONNECTED; delete/assignment missing |
| /admin/events/[eventId]/checkins | getCheckins + CheckinHistory | CONNECTED; take 100 |
| /admin/events/[eventId]/reports | getReportData | CONNECTED; export miswired |
| /admin/users | getUsers + UserManager | CONNECTED; super admin only |
| /scanner | getEvents | CONNECTED; no-DB notice |
| /scanner/[eventId] | getEvent + active gates + ScannerClient | CONNECTED; camera not tested |
| /ticket/[token] | public token hash lookup | CONNECTED with real DB; FAILS ungracefully when DATABASE_URL missing |

### API Routes

| Route family | Handler | Auth/scope | สถานะ |
|---|---|---|---|
| /api/auth/[...nextauth] | credentials/session | NextAuth | CONNECTED |
| /api/checkin, /api/checkin/manual | QR/manual check-in | auth + event checkin:write | CONNECTED; concurrency not verified |
| /api/events | list/create | auth; write permission | CONNECTED; global singleton guard |
| /api/events/[eventId] | read/update/cancel | requireEvent | CONNECTED; transition/audit gaps |
| /api/events/[eventId]/attendees | list/create | read/write | CONNECTED; query status cast as never |
| /api/events/[eventId]/attendees/[attendeeId] | update/cancel | write | BACKEND_ONLY |
| /api/events/[eventId]/attendees/import | multipart import | write | CONNECTED; unbounded input |
| /api/events/[eventId]/attendees/export | XLSX export | read | CONNECTED |
| /api/events/[eventId]/attendees/template | CSV template | read | CONNECTED |
| /api/events/[eventId]/tickets/generate | bulk generate | tickets:write | CONNECTED; raw token delivery gap |
| /api/events/[eventId]/tickets/cancel | bulk cancel | tickets:write | CONNECTED; attendee status semantics need review |
| /api/events/[eventId]/gates | list/create | read/write | CONNECTED |
| /api/gates/[gateId] | update gate | events:write | CONNECTED; no DELETE |
| /api/events/[eventId]/checkins | list | auth + event scope only | AUTHORIZATION GAP |
| /api/events/[eventId]/dashboard | report data | auth + event scope only | AUTHORIZATION GAP |
| /api/events/[eventId]/reports | report data | auth + event scope only | AUTHORIZATION GAP |
| /api/tickets/[ticketId]/cancel | cancel ticket | tickets:write | CONNECTED |
| /api/tickets/[ticketId]/reactivate | reactivate ticket | tickets:write | CONNECTED; expiry/state gap |
| /api/tickets/[ticketId]/regenerate | regenerate QR | tickets:write | CONNECTED; expiry/history gap |
| /api/users, /api/users/[userId] | user create/update | super admin | CONNECTED; final admin protection gap |
| /api/users/[userId]/assignments | assignment upsert | super admin | BACKEND_ONLY |
| /api/health, /api/ready | health/readiness | — | MISSING |

รวม route ปัจจุบัน: UI 16 routes, API 23 routes; missing operational/public routes ที่ audit ต้องการ: /api/health, /api/ready และ /events/[eventId]

## Missing Features

- Prisma migration baseline, deploy/rollback/backup lifecycle
- Production environment validation และ readiness endpoint
- Public read-only event page
- EventDay/session model สำหรับ MULTI_DAY และ report semantics สำหรับ REENTRY
- TicketHistory, delivery status, resend/revoke history
- Gate delete, device assignment, device registry และ capacity
- Password change/reset/first-login change
- Audit log viewer/export
- Pagination/query cursor สำหรับ attendee, ticket, check-in และ report follow-up list
- Offline queue/retry/reconciliation สำหรับ scanner
- Object storage upload/policy; ปัจจุบันเป็น arbitrary image URL
- CI/CD, Docker image, Vercel runtime contract, health check, backup/restore runbook

## Partial Features

- Development auth bypass ช่วย demo แต่ทำให้ login/UAT ไม่ production-like
- Event status ใช้ enum ได้ แต่ไม่มี transition matrix
- Single-entry flow มี transaction/conditional update แต่ยังไม่มี concurrency evidence
- REENTRY แยกจาก single-entry แค่ duplicate condition; ไม่มี session/day และ report นับครั้ง
- MULTI_DAY แสดงใน UI แต่ backend ใช้ behavior ใกล้ single-entry
- Bulk generation สร้าง token ใหม่ได้ แต่ UI ไม่แสดง/ส่งมอบทุก token และไม่มี history
- Import รองรับ Excel/CSV แต่ไม่มี size/MIME/content limit หรือ duplicate preview
- scanner มี camera/torch/fullscreen/manual/online indicator แต่ไม่ queue offline
- admin UI มี empty/error state บางหน้า แต่ไม่มี loading skeleton และบาง DB error เป็น generic 500
- design source ใหม่ชัดเจน แต่ implementation ปัจจุบันยังเป็น navy/turquoise/Kanit และมี raw hex ใน components

## UI Without Logic

- Dashboard “Check-in ล่าสุด” แสดงข้อความว่าข้อมูลจะมาเมื่อมีการสแกน แต่ page ไม่โหลด getCheckins หรือ recent check-in data
- Report Export button อยู่บนหน้ารายงาน แต่ชี้ไป attendee export ไม่ใช่ report export
- Multi-day option มีใน Event form/schema แต่ไม่มี day/session logic
- Event assignment count แสดงใน user table แต่ไม่มี UI จัดการ assignment
- Gate manager แสดง Device Code และปุ่ม copy แต่ไม่มี device registry/assignment
- Public event information page ไม่มี route จึงไม่มี UI ให้ผู้ลงทะเบียนดูรายละเอียด Event

## Backend Without UI

- Attendee PATCH/soft-cancel API
- User event assignment upsert API
- AuditLog write และ permission audit:read โดยไม่มี audit viewer
- Report/dashboard/checkin API endpoints มี แต่ page dashboard ไม่ใช้ recent check-in endpoint
- Gate deviceCode generation มี แต่ไม่มี device lifecycle/assignment
- Ticket bulk cancel/regenerate/reactivate API มี แต่ UI ไม่มี full state validation/history

## Security Findings

อ้างอิง AUD-P1-003, AUD-P1-004, AUD-P1-005, AUD-P1-006, AUD-P2-009, AUD-P2-010, AUD-P2-013, AUD-P3-004

- token ใช้ randomBytes + SHA-256 hash ถือว่าเป็นแนวทางที่ดี แต่ public pass เปิดเผย PII/QR และยังไม่มี no-store/noindex policy
- production auth ไม่ควรพึ่ง secret ที่ไม่ผ่าน validation และไม่ควรมี default development behavior ใน shared environment
- report/check-in read endpoints ตรวจ event scope แต่ไม่ตรวจ permission ที่ตรงกับ rolePermissions
- rate limit อยู่ใน process memory และ trust x-forwarded-for โดยไม่มี edge/proxy contract
- seed password คงที่และถูกพิมพ์ใน stdout หาก seed ถูกเรียกใน environment ที่ไม่ใช่ NODE_ENV=production

## Data Integrity Findings

อ้างอิง AUD-P1-001, AUD-P1-002, AUD-P1-007, AUD-P2-001, AUD-P2-002, AUD-P2-006, AUD-P2-007, AUD-P2-015

- ไม่มี idempotency key หรือ unique constraint ที่แสดงเจตนา “หนึ่ง check-in ต่อ ticket ต่อ day/session”
- successful check-in ของ REENTRY ถูกนับเป็นหลายคนใน dashboard/report
- regenerate/reactivate ไม่ clear expiresAt
- audit log หลาย mutation เขียนหลัง state mutation และอยู่นอก transaction
- import/duplicate/referenceCode ไม่มี data contract ที่ enforce ระดับ DB
- event status เปลี่ยนข้ามสถานะได้ และ create route ใช้ findFirst global guard ที่ raceable
- timezone ของ dashboard ใช้ server local day boundary ไม่ใช่ Asia/Bangkok อย่างสม่ำเสมอ

## Database Findings

อ้างอิง AUD-P0-001, AUD-P0-002, AUD-P2-003, AUD-P2-014

- schema มี relation cascade หลายจุด; hard delete ที่เกิดจาก DB/client อื่นสามารถลบ attendee/ticket/checkin/audit ตาม event ได้
- ไม่มี migration directory, migration status หรือ rollback record
- query รายชื่อ attendee/ticket ไม่มี cursor pagination; check-in/report ใช้ hard cap 100/200
- Prisma/P2025 และ DB errors ส่วนใหญ่ถูก map เป็นข้อความ 500 เดียว ไม่มี request id/correlation

## QR and Check-in Findings

อ้างอิง AUD-P1-001, AUD-P1-002, AUD-P1-006, AUD-P1-007, AUD-P2-006, AUD-P2-012

- token entropy/hash ดีและ old hash ถูก overwrite ตอน regenerate
- single-entry uses transaction + conditional update แต่ยังไม่มี test against 10 concurrent requests
- REENTRY ไม่มี session/day และ MULTI_DAY ไม่ได้ implement
- public token route ยังไม่มี cache-control/noindex และ DB error boundary
- scanner offline แค่หยุด request; ไม่มี durable queue/retry
- device id default เป็น browser จึงแยกเครื่องไม่ได้เมื่อ localStorage ไม่มีค่า

## Authentication and Permission Findings

อ้างอิง AUD-P1-004, AUD-P1-005, AUD-P3-004

- admin layout กัน unauthenticated route ได้ และ mutation สำคัญใช้ requireEvent
- server re-check user active ช่วยให้ disable account มีผล
- ไม่มี login rate limit, lockout, password reset/change หรือ first-login enforcement
- reports/dashboard/checkins read paths ใช้ auth + scope โดยไม่เรียก reports:read
- UI แสดง tab/edit/action บางส่วนแก่ role ที่ API จะปฏิเสธ ทำให้ UX สับสนและพึ่ง server error

## Vercel Findings

อ้างอิง AUD-P0-001, AUD-P0-002, AUD-P2-009, AUD-P2-010, AUD-P2-011

- Next build ผ่าน แต่ไม่มี runtime env schema/validation
- ไม่มี Prisma migration deploy step หรือ build/postinstall contract ที่ชัดเจน
- in-memory rate limit ใช้ข้าม instance/region ไม่ได้
- ไม่มี health/readiness, structured logs, request id หรือ deployment smoke route
- next.config.ts ไม่มี standalone output, security headers หรือ image policy
- ถ้า NEXT_PUBLIC_APP_URL/NEXTAUTH_URL ไม่ถูกตั้ง ticket URL อาจ fallback localhost

## Docker Production Findings

อ้างอิง AUD-P0-001, AUD-P0-002, AUD-P2-011

- ไม่มี Dockerfile, docker-compose หรือ migration job
- production image contract ยังไม่ระบุ Node version, non-root user, standalone output, healthcheck และ graceful shutdown
- local PostgreSQL ใน .env.example เพียงพอสำหรับ developer setup แต่ไม่ใช่ production DB/backup/restore plan
- ก่อนทำ Docker ต้องตัดสินใจว่า migration run เป็น release job แยกจาก web container หรือ entrypoint ที่มี lock/observability

## UX and Accessibility Findings

อ้างอิง AUD-P2-004, AUD-P2-005, AUD-P2-016, AUD-P3-001, AUD-P3-002, AUD-P3-003, AUD-P3-005, AUD-P3-006, AUD-P3-009

- design source ใหม่กำหนด ink #171717, canvas #fafafa, surface #ffffff, hairline #ebebeb, Geist/Inter + Geist Mono, 4px spacing scale, 6–8px app radius, subtle stacked shadow และ mesh gradient เฉพาะ hero scale
- code ปัจจุบันยังใช้ navy/turquoise, Kanit, radius/shadow และ raw hex หลายจุด จึงยังไม่ใช่ visual system เดียวกับ design ใหม่
- design ใหม่เป็น marketing-first; operational pages ควรใช้ dense adaptation: compact sidebar/table, ไม่ใช้ 96–192px section gaps บน scanner/attendee workspace
- Field component ไม่ส่ง id/aria-describedby และ label ไม่ผูก htmlFor
- gate copy แจ้ง success แม้ clipboard API ไม่มีหรือ reject
- destructive/bulk action บางจุดไม่มี confirmation หรือ undo ที่ชัดเจน
- report chart เป็น visual-only bar list ไม่มี table summary/legend ที่ครบสำหรับ screen reader
- mobile/camera/HTTPS matrix ยังไม่รันจริง

## Performance Findings

อ้างอิง AUD-P2-002, AUD-P2-003, AUD-P2-012, AUD-P2-016

- import อ่าน workbook ทั้งไฟล์เข้าหน่วยความจำและประมวลผล row-by-row โดยไม่มี file size/row limit
- attendee/ticket queries ดึงข้อมูลจำนวนมากโดยไม่มี cursor/virtualization strategy
- scanner โหลด ZXing แบบ dynamic ซึ่งเป็นข้อดี แต่ไม่มี offline cache/queue และใช้ reload หลัง mutation หลายจุด
- ไม่มี loading.tsx/Suspense skeleton สำหรับ server pages ที่อาจรอ DB
- build bundle ผ่าน แต่ยังไม่มี real dataset/performance baseline

## Test Coverage Gaps

- tests ปัจจุบันครอบคลุม status label, permissions 2 cases, QR 2 cases และ validation 3 cases รวม 8 tests
- ไม่มี API route tests สำหรับ auth/validation/error mapping
- ไม่มี Prisma integration test กับ PostgreSQL
- รัน HTTP concurrent probe 10 requests แล้วได้ 10 x 500 จาก missing DATABASE_URL; ยังไม่มี DB integration test ที่ assert success/duplicate/row count
- ไม่มี UAT role matrix: SUPER_ADMIN, EVENT_ADMIN, EVENT_STAFF, VIEWER
- ไม่มี browser E2E สำหรับ create Event → attendee → QR → scanner → report
- ไม่มี camera/HTTPS/mobile test และไม่มี viewport 375/430/768/1440 ใน Browser environment นี้
- ไม่มี migration smoke, backup/restore, Docker image, Vercel preview หรือ health-check test

### Verification Commands Run

| Command | ผล |
|---|---|
| npm install | PASS; up to date |
| npm audit | PASS; 0 vulnerabilities |
| npm audit --omit=dev | PASS; 0 vulnerabilities |
| npm run db:generate | PASS หลังหยุด dev server |
| npm run db:validate | FAIL P1012: DATABASE_URL missing |
| npx prisma migrate status | FAIL P1012: DATABASE_URL missing; migration directory absent |
| npx prisma format | PASS; schema was formatting-only changed after the audit report was created; no model/enum semantic change intended |
| npm run typecheck | PASS |
| npm run lint | PASS |
| npm run test | PASS with escalated execution; 4 files/8 tests |
| npm run build | PASS; warning: Next.js plugin not detected in ESLint config |

### Browser Smoke Test

- /admin/dashboard: PASS; page title Event TIRD | Operations Desk, branding Event TIRD / IIRFA 2026 ถูกต้อง, zero-state dev fallback render ได้
- /login: redirect ไป /admin/dashboard ตาม DEV_AUTH_BYPASS; real credentials ไม่ได้ทดสอบ
- /admin/events: render error notice “ตรวจสอบ DATABASE_URL” ไม่ใช่ blank page
- /admin/events/new: form/stepper render ได้จริง
- /scanner: render error notice เมื่อโหลด Event ไม่ได้
- /ticket/evt_invalid_audit_token_1234567890: blank/error boundary ใน Browser; console มี PrismaClientInitializationError จาก prisma.ticket.findUnique เพราะ DATABASE_URL missing
- viewport ที่ตรวจได้: innerWidth 1280, clientWidth 1265, height 720
- ไม่อ้างว่า camera, torch, 375/430/768/1440 หรือ production HTTPS ผ่าน เพราะ environment นี้ตรวจไม่ได้

## P0 Blockers

### AUD-P0-001 — ไม่มี Prisma migration/release lifecycle

- Severity: P0
- Feature/problem: schema มีแต่ prisma/migrations ไม่มี; db:migrate เป็น prisma migrate dev ไม่ใช่ production deploy contract
- Evidence: prisma/schema.prisma:1-235, package.json:13-16, directory prisma/migrations ไม่พบ
- Impact/repro: fresh UAT/production deploy ไม่สามารถยืนยัน schema version, apply order, rollback หรือ audit database change ได้; npx prisma migrate status ตรวจไม่ได้ด้วย environment ปัจจุบัน
- Fix: สร้าง baseline migration หลัง owner approve schema, ใช้ prisma migrate deploy ใน release job, ทำ backup/restore และ rollback runbook; Complexity M
- UAT blocker: YES; Production blocker: YES

### AUD-P0-002 — UAT runtime ไม่มี DATABASE_URL/env contract

- Severity: P0
- Feature/problem: environment ที่ตรวจไม่มี DATABASE_URL; app จึงใช้ dev fallback บางหน้าแต่ data flow จริงทำงานไม่ได้
- Evidence: .env.example:1-7, src/lib/auth.ts:30-42, src/lib/server-data.ts:44-51, Prisma P1012, Browser /admin/events และ /scanner
- Impact/repro: รัน validate/migrate ไม่ได้, หน้า event/scanner โหลด DB ไม่ได้, public ticket โยน initialization error; จัดเป็น environment blocker ไม่ใช่ data bug ที่แก้ด้วย UI
- Fix: provision PostgreSQL, set DATABASE_URL/AUTH_SECRET/NEXTAUTH_URL/NEXT_PUBLIC_APP_URL ผ่าน secret manager, validate at startup/readiness; Complexity S code + external DB
- UAT blocker: YES; Production blocker: YES

## P1 Critical Issues

### AUD-P1-001 — concurrent check-in/idempotency ยังพิสูจน์ไม่ได้

- Severity: P1
- Feature/problem: Checkin ไม่มี idempotency key/unique contract ต่อ ticket/day/session; service มี conditional update แต่ไม่มี integration proof
- Evidence: prisma/schema.prisma:191-213, src/lib/checkin-service.ts:16-67
- Impact/repro: retry/network race หรือ same QR จากหลาย gate อาจสร้าง log semantics ที่ไม่ชัด; HTTP probe 10 requests ได้ 10 x 500 เพราะ DATABASE_URL missing จึงยังไม่ได้ทดสอบ ticket จริงหรือ assert success/duplicate/row count; Complexity M
- Fix: เพิ่ม idempotency key/request id และ unique constraint ตาม SINGLE_ENTRY/REENTRY/EventDay, ใช้ transaction isolation ที่เหมาะสมและ integration test; Complexity M
- UAT blocker: YES หากเปิด check-in; Production blocker: YES

### AUD-P1-002 — REENTRY/MULTI_DAY domain semantics ไม่ตรง feature label

- Severity: P1
- Feature/problem: MULTI_DAY ไม่มี EventDay/session; REENTRY อนุญาตหลาย success logs แต่ reports/dashboard นับเป็นจำนวนคน
- Evidence: prisma/schema.prisma:23-35, src/lib/checkin-service.ts:50-60, src/lib/server-data.ts:74-92
- Impact/repro: เลือก MULTI_DAY แล้ว behavior ไม่แยกวัน; REENTRY rate อาจเกิน 100% และ no-show เพี้ยน; Complexity L
- Fix: เพิ่ม EventDay/session และ unique rule, นับ unique attendee ใน KPI, แยก visit count กับ attendee count; หรือ disable mode จนกว่าจะทำเสร็จ
- UAT blocker: YES ถ้าเปิด mode; Production blocker: YES ถ้าเปิด mode

### AUD-P1-003 — seed มี default password และ guard ไม่แข็งแรง

- Severity: P1
- Feature/problem: seed ใช้ ChangeMe123!, พิมพ์ password ใน stdout, guard แค่ NODE_ENV=production และสร้าง events ใหม่ทุกครั้ง
- Evidence: prisma/seed.ts:9-15, :25-26, :42-59
- Impact/repro: staging/production-like environment ที่ NODE_ENV ไม่ใช่ production อาจได้ credential เดาได้; seed ซ้ำสร้าง event/attendee ใหม่และทำข้อมูลปน; Complexity S-M
- Fix: seed ต้อง opt-in ด้วย explicit flag, สร้าง secret จาก env/one-time output, ห้าม log password, ใช้ fixture IDs/upsert แบบ idempotent และ block หากไม่ใช่ local
- UAT blocker: YES หากใช้ seed; Production blocker: YES

### AUD-P1-004 — authentication ยังไม่มี hardening สำหรับ shared environment

- Severity: P1
- Feature/problem: ไม่มี login rate limit/lockout/password reset/change/first-login policy และ secret ไม่ validate; DEV_AUTH_BYPASS เป็น true ใน .env.example
- Evidence: .env.example:2, :6, src/lib/auth.ts:9-47, src/lib/validation.ts:7-8
- Impact/repro: brute-force login ไม่มี control; shared UAT อาจ bypass auth โดยไม่ตั้งใจ; secret สั้น/placeholder ทำให้ deployment misconfigured; Complexity M
- Fix: env schema + min entropy, default bypass false, login rate limit/audit, password lifecycle และ explicit UAT profile; Complexity M
- UAT blocker: YES for role/security UAT; Production blocker: YES

### AUD-P1-005 — report/check-in read authorization ไม่ตรง rolePermissions

- Severity: P1
- Feature/problem: /reports, /dashboard, /checkins ใช้ authenticated + event scope แต่ไม่ require reports:read/events:read อย่างชัดเจน
- Evidence: src/app/api/events/[eventId]/reports/route.ts:8-16, dashboard/route.ts:8-16, checkins/route.ts, src/lib/permissions.ts:14-18
- Impact/repro: EVENT_STAFF ที่มี assignment อาจอ่าน report/check-in data แม้ rolePermissions ไม่ได้ให้ reports:read; ต้องทดสอบด้วย staff role เมื่อมี DB
- Fix: enforce permission in route/service, hide unauthorized tabs/actions, add role matrix tests; Complexity S
- UAT blocker: YES for permission UAT; Production blocker: YES

### AUD-P1-006 — public ticket privacy/cache และ DB failure boundary ไม่พร้อม

- Severity: P1
- Feature/problem: public token route แสดงชื่อ/venue/date/QR แต่ไม่ตั้ง Cache-Control no-store, robots/noindex และไม่ catch Prisma initialization error
- Evidence: src/app/ticket/[token]/page.tsx:1-30; Browser console PrismaClientInitializationError ที่ prisma.ticket.findUnique()
- Impact/repro: token/PII อาจถูก cache/share; DB outage ทำให้ blank/error page; เปิด URL invalid ใน environment ไม่มี DB แล้วได้ runtime error
- Fix: set no-store/private/noindex, minimize PII, add graceful public error boundary and observability; Complexity S-M
- UAT blocker: YES for public pass UAT; Production blocker: YES

### AUD-P1-007 — regenerate/reactivate ไม่ clear expiresAt

- Severity: P1
- Feature/problem: ออก QR ใหม่หรือ reactivate ticket ที่หมดอายุยังคง expiresAt เดิม
- Evidence: src/app/api/tickets/[ticketId]/regenerate/route.ts:17-19, reactivate/route.ts:15-17
- Impact/repro: ticket ที่สร้างใหม่อาจถูก mark EXPIRED ทันที; reactivated ticket ที่หมดอายุยังเข้าไม่ได้; Complexity S
- Fix: กำหนด expiry policy ใหม่ชัดเจนและ update expiresAt/null ใน transaction พร้อม state validation/history; Complexity S-M
- UAT blocker: YES for ticket lifecycle UAT; Production blocker: YES

## P2 High Issues

### AUD-P2-001 — audit log ไม่ผูกกับทุก state mutation ใน transaction

- Severity: P2
- Feature/problem: หลาย route update state แล้ว create audit ภายหลังคนละ transaction
- Evidence: src/app/api/events/[eventId]/route.ts:26-40, src/app/api/tickets/[ticketId]/cancel/route.ts:15-17, src/lib/audit.ts:14
- Impact/repro: state สำเร็จแต่ audit fail ได้ ทำให้ forensic trail ไม่ครบ; Complexity M
- Fix: รวม mutation + audit ใน transaction และเพิ่ม failure logging; Complexity M
- UAT blocker: NO; Production blocker: YES for compliance/forensics

### AUD-P2-002 — import ไม่มี file/row/content limits

- Severity: P2
- Feature/problem: รับ File ใด ๆ, อ่าน workbook ทั้งไฟล์, ไม่มี byte limit, row limit, MIME/content validation หรือ duplicate preview
- Evidence: src/app/api/events/[eventId]/attendees/import/route.ts:19-49, attendeeSchema referenceCode ไม่มี unique
- Impact/repro: memory/CPU abuse และ duplicate/partial data; upload ไฟล์ใหญ่แล้ว import row-by-row; Complexity M
- Fix: จำกัด size/rows/columns, ตรวจ MIME/signature, parse streaming/worker, dry-run preview และ unique/duplicate policy; Complexity M
- UAT blocker: YES ถ้า import เป็น scope; Production blocker: YES

### AUD-P2-003 — pagination และ query bounds ไม่สม่ำเสมอ

- Severity: P2
- Feature/problem: getAttendees/getTickets ดึงทั้งหมด, API attendee cap 200, check-ins/report list cap 100 ไม่มี cursor
- Evidence: src/lib/server-data.ts:58-70, :85, attendees/route.ts:18
- Impact/repro: dataset โตแล้ว response/DOM/DB memory โตตามและผู้ใช้เห็นข้อมูลไม่ครบ; Complexity M
- Fix: cursor pagination, server filters/sorts, virtualized table และ export job แยก; Complexity M
- UAT blocker: NO for small fixture; Production blocker: YES

### AUD-P2-004 — dashboard recent check-ins เป็น UI-only

- Severity: P2
- Feature/problem: section แสดงข้อความ static ว่ารายการล่าสุดจะมาเมื่อสแกน แต่ไม่มี query/use data
- Evidence: src/app/admin/dashboard/page.tsx:47 และ getCheckins ใน src/lib/server-data.ts:64-70
- Impact/repro: มี check-in จริงแล้ว dashboard ยังไม่แสดง recent list; user เข้าใจระบบไม่ครบ
- Fix: เพิ่ม getRecentCheckins scoped + limit/refresh/loading/error state หรือเปลี่ยน copy ให้ชัดว่าไม่อยู่ใน scope; Complexity S-M
- UAT blocker: NO; Production blocker: NO แต่เป็น acceptance gap

### AUD-P2-005 — report Export action ผิดปลายทาง

- Severity: P2
- Feature/problem: ปุ่ม Export บน report page download attendee export
- Evidence: src/app/admin/events/[eventId]/reports/page.tsx:18 ชี้ /attendees/export
- Impact/repro: ผู้ใช้คาดว่าจะได้ report แต่ได้รายชื่อ attendee; data product mismatch
- Fix: สร้าง report export endpoint หรือเปลี่ยน label/action ให้ตรง; add E2E assertion on filename/columns; Complexity S
- UAT blocker: YES หาก export เป็น acceptance; Production blocker: NO

### AUD-P2-006 — bulk QR ไม่มี delivery/history และ raw token ถูกส่งกลับกว้าง

- Severity: P2
- Feature/problem: generate API คืน publicToken/publicUrl ทุกใบ, UI แสดงเฉพาะผลและ reload ทิ้ง token, ไม่มี delivery status/history
- Evidence: src/app/api/events/[eventId]/tickets/generate/route.ts:17-27, attendee route:37, attendee-manager.tsx
- Impact/repro: ผู้จัดงานไม่รู้ว่า QR ใดถูกส่งแล้ว; response ใหญ่และ secret อยู่ใน client response; regenerate/invalidate audit history ไม่ครบ
- Fix: ticket issuance record, one-time delivery/download flow, จำกัด response, explicit resend/revoke status; Complexity L
- UAT blocker: YES หากมี delivery acceptance; Production blocker: YES for operational traceability

### AUD-P2-007 — Event status transition และ global single-event guard ไม่ปลอดภัยเชิง domain

- Severity: P2
- Feature/problem: PATCH รับ enum status ใด ๆ ไม่มี transition matrix; POST ใช้ findFirst ป้องกัน event ซ้ำทั้งระบบและ race ได้
- Evidence: src/app/api/events/[eventId]/route.ts:26, src/app/api/events/route.ts, validation eventSchema
- Impact/repro: เปลี่ยน CANCELLED กลับ ACTIVE หรือข้าม DRAFT ได้; concurrent create อาจชน; ถ้าตั้งใจ IIRFA เดียวควรเป็น explicit singleton rule
- Fix: transition service, DB constraint/transaction lock และแยก project/event scope; Complexity M
- UAT blocker: YES for event lifecycle; Production blocker: YES

### AUD-P2-008 — Gate lifecycle ไม่ครบ

- Severity: P2
- Feature/problem: มี create/edit/toggle/deviceCode แต่ไม่มี delete, device assignment, device registry, capacity หรือ deactivation confirmation
- Evidence: src/app/api/gates/[gateId]/route.ts:1-20, src/components/gate/gate-manager.tsx:19-21
- Impact/repro: gate เก่าค้างและไม่รู้ว่า scanner เครื่องใดได้รับอนุญาต; operational setup ทำได้ไม่ครบ
- Fix: soft-delete/archive, Device model/assignment, gate capacity policy และ audit; Complexity M
- UAT blocker: NO หากใช้ gate คงที่; Production blocker: YES ถ้าหลาย gate/device

### AUD-P2-009 — rate limit เป็น in-memory และ request metadata trust สูง

- Severity: P2
- Feature/problem: rate-limit map อยู่ใน process, ไม่ cleanup global/distributed, ไม่ครอบ login; x-forwarded-for ใช้ header แรกทันที
- Evidence: src/lib/rate-limit.ts:1-21, src/lib/http.ts:14, manual/route.ts:13
- Impact/repro: Vercel หลาย instance bypass/ไม่ share quota; spoofed proxy header ทำให้ key ผิด; manual 429 ไม่มี Retry-After
- Fix: Redis/edge limiter ที่มี proxy trust contract, cleanup/TTL และ rate-limit login; Complexity M
- UAT blocker: NO; Production blocker: YES

### AUD-P2-010 — observability/operational endpoints หาย

- Severity: P2
- Feature/problem: ไม่มี /api/health, /api/ready, request id, structured server logs หรือ error correlation
- Evidence: route inventory ไม่มี health/ready, src/lib/http.ts:6-11
- Impact/repro: deploy/load balancer ตรวจ readiness ไม่ได้และ error production trace ยาก
- Fix: liveness/readiness แยก DB check, request id, structured logs/PII redaction, alert/retention; Complexity M
- UAT blocker: NO; Production blocker: YES

### AUD-P2-011 — Vercel/Docker production contract ยังไม่มี

- Severity: P2
- Feature/problem: ไม่มี Dockerfile/compose/vercel.json/standalone config/postinstall Prisma generate/CI
- Evidence: next.config.ts:1-7, package.json:7-16, file existence audit
- Impact/repro: local build ผ่านแต่ deployment/runtime/migration/health behavior ไม่ถูกกำหนด
- Fix: define runtime matrix, standalone/non-root image, migration release job, env/health checks and CI; Complexity M
- UAT blocker: NO; Production blocker: YES

### AUD-P2-012 — scanner ไม่มี offline queue และ device identity แข็งแรง

- Severity: P2
- Feature/problem: offline แค่แสดง error; deviceId fallback เป็น browser และ generated id ไม่ persist/ไม่ assign
- Evidence: src/components/scanner/scanner-client.tsx:55-68
- Impact/repro: network drop แล้ว scan ไม่ถูก queue; หลายเครื่อง audit แยกกันไม่ได้
- Fix: durable queue with reconciliation/idempotency, persisted device UUID, Device/Gate assignment; Complexity L
- UAT blocker: YES if offline is scope; Production blocker: YES for unreliable venue network

### AUD-P2-013 — event image รับ arbitrary URL แทน upload policy

- Severity: P2
- Feature/problem: eventSchema รับ z.url และ UI ใช้ CSS background image จาก URL โดยไม่มี HTTPS/allowlist/storage policy
- Evidence: src/lib/validation.ts:16-24, src/app/admin/events/[eventId]/page.tsx:24
- Impact/repro: broken/mixed-content/third-party privacy และ content policy ไม่แน่นอน; Complexity M
- Fix: object storage upload, MIME/size/dimension validation, signed/public policy, HTTPS allowlist; Complexity M
- UAT blocker: NO; Production blocker: YES if user-supplied images are enabled

### AUD-P2-014 — generic error mapping กลบ recovery path

- Severity: P2
- Feature/problem: apiError map generic 500 และ P2025/DB initialization ไม่มี structured error/retry guidance; public page ไม่ใช้ apiError boundary
- Evidence: src/lib/http.ts:6-11, public ticket Browser console error
- Impact/repro: user/admin ไม่รู้ว่าควร retry, check env หรือแก้ record ไหน; incident response ช้า
- Fix: typed error codes, request id, safe user message + server log, map P2025 to 404, retry UI; Complexity M
- UAT blocker: NO; Production blocker: YES

### AUD-P2-015 — timezone ใช้ไม่สม่ำเสมอ

- Severity: P2
- Feature/problem: formatter ใช้ Asia/Bangkok แต่ dashboard day boundary ใช้ server local และ datetime-local แปลงด้วย new Date(value)
- Evidence: src/lib/server-data.ts:44-55, src/lib/timezone.ts:27-30
- Impact/repro: “เข้างานวันนี้”/open-close window อาจคลาดเมื่อ server timezone ไม่ใช่ Bangkok; Complexity M
- Fix: store UTC, parse datetime-local with explicit Asia/Bangkok conversion, use zoned day boundaries; test DST/edge cases where relevant
- UAT blocker: YES for time-window UAT; Production blocker: YES

### AUD-P2-016 — ไม่มี loading skeleton/async state สม่ำเสมอ

- Severity: P2
- Feature/problem: server pages ไม่มี loading.tsx/Suspense; mutation หลายจุดใช้ window.location.reload
- Evidence: route inventory ไม่มี loading files, attendee/gate managers use reload
- Impact/repro: slow DB/network ดูเหมือนหน้าค้าง และ scroll/filter state หาย; Complexity S-M
- Fix: route-level skeleton, mutation cache/revalidate, preserve filter/scroll and inline pending state; Complexity M
- UAT blocker: NO; Production blocker: NO but quality gap

## P3 Medium Issues

### AUD-P3-001 — Field label ไม่ผูกกับ input

- Severity: P3
- Feature/problem: Field render label โดยไม่มี htmlFor/id contract
- Evidence: src/components/ui/field.tsx:3-4
- Impact/repro: screen reader/label click association ไม่ครบ; Complexity S
- Fix: generate/use stable id, aria-describedby for hint/error; Complexity S
- UAT blocker: NO; Production blocker: NO

### AUD-P3-002 — Gate copy แจ้ง success แม้ clipboard fail

- Severity: P3
- Feature/problem: await navigator.clipboard?.writeText แล้ว set success โดยไม่ catch
- Evidence: src/components/gate/gate-manager.tsx:20
- Impact/repro: insecure context/permission denied ยังเห็น “คัดลอกแล้ว”; Complexity S
- Fix: try/catch + fallback manual copy/message; Complexity S
- UAT blocker: NO; Production blocker: NO

### AUD-P3-003 — confirmation/undo ของ destructive และ bulk action ไม่สม่ำเสมอ

- Severity: P3
- Feature/problem: user role/active, gate disable และบาง bulk generation ไม่มี confirmation/undo ที่ชัด
- Evidence: src/components/user/user-manager.tsx:19-20, gate/attendee managers
- Impact/repro: operator click ผิดแล้วเปลี่ยนสิทธิ์/invalidates QR; Complexity S
- Fix: confirm dialog with consequence, audit preview and undo/recovery where possible; Complexity S
- UAT blocker: NO; Production blocker: NO

### AUD-P3-004 — UI permission visibility ไม่ตรง server permission

- Severity: P3
- Feature/problem: tabs/edit links/action บางรายการแสดงก่อน server จะ deny
- Evidence: src/components/event/event-tabs.tsx, admin event pages, src/lib/guards.ts
- Impact/repro: read-only user กดแล้วได้ 403/redirect แทนที่จะเห็น affordance ที่ถูกต้อง; Complexity S-M
- Fix: derive capabilities once and hide/disable actions with explanatory state; server remains authority
- UAT blocker: NO; Production blocker: NO

### AUD-P3-005 — UI ยังไม่ใช้ design source ใหม่

- Severity: P3
- Feature/problem: current UI เป็น navy/turquoise/Kanit + raw hex; external design กำหนด ink/canvas/Geist/mesh/stacked shadow
- Evidence: src/app/globals.css:5-24, tailwind.config.ts, D:\code internal TIRD\time worker\design.md:59-776
- Impact/repro: visual inconsistency และไม่ตรง request “สะอาดตาทันสมัย”; Complexity M
- Fix: token layer → primitives → app shell/dashboard/workspace/scanner; preserve semantic status colors and operational density; Complexity M-L
- UAT blocker: NO; Production blocker: NO, but launch quality gate

### AUD-P3-006 — report/data visualization accessibility ยังไม่ครบ

- Severity: P3
- Feature/problem: hourly bar ใช้ height/title เป็นหลักและไม่มี table summary/legend/keyboard data path
- Evidence: src/app/admin/events/[eventId]/reports/page.tsx:18
- Impact/repro: screen reader/low vision เข้าใจ trend ได้ยาก; Complexity S-M
- Fix: text table summary, labels/aria, accessible contrast and non-color cues; Complexity S-M
- UAT blocker: NO; Production blocker: NO

### AUD-P3-007 — Audit viewer ไม่มี UI

- Severity: P3
- Feature/problem: audit:read permission/model มีแต่ไม่มี page/filter/export
- Evidence: prisma/schema.prisma:216-234, src/lib/permissions.ts:14-18, route inventory
- Impact/repro: operator ตรวจย้อนหลังไม่ได้แม้ log ถูกเขียน; Complexity M
- Fix: scoped audit viewer with filters, redaction and export policy; Complexity M
- UAT blocker: NO; Production blocker: NO unless compliance requires

### AUD-P3-008 — manual check-in 429 ไม่มี Retry-After

- Severity: P3
- Feature/problem: QR route ส่ง header แต่ manual route ส่งแค่ status 429
- Evidence: src/app/api/checkin/route.ts:13, src/app/api/checkin/manual/route.ts:13
- Impact/repro: client ไม่รู้ควรรอนานเท่าไร; Complexity S
- Fix: shared rate-limit response helper with Retry-After; Complexity S
- UAT blocker: NO; Production blocker: NO

### AUD-P3-009 — mobile/camera/HTTPS verification ยังไม่ทำ

- Severity: P3
- Feature/problem: ไม่มี automated/browser matrix ที่ 375/430/768/1440 และไม่มี real camera HTTPS run
- Evidence: audit environment viewport 1280x720 only; ScannerClient code path not device proof
- Impact/repro: cannot certify venue device behavior, torch, permission, landscape or table overflow; Complexity M (test setup)
- Fix: Playwright/browser matrix + physical device checklist on HTTPS; Complexity M
- UAT blocker: YES for scanner UAT; Production blocker: YES for venue launch

## P4 Low Issues

### AUD-P4-001 — README ยังไม่ใช่ operational runbook

- Severity: P4
- Feature/problem: README มี setup สั้น ๆ แต่ไม่มี migration, seed safety, backup, rollback, UAT/prod checklist
- Evidence: README.md:1-17
- Impact/repro: operator setup ต่างกันและ incident recovery ช้า; Complexity S
- Fix: link audit/runbook/env matrix and safe seed instructions; Complexity S
- UAT blocker: NO; Production blocker: NO

### AUD-P4-002 — toolchain warnings

- Severity: P4
- Feature/problem: Prisma package.json config deprecated warning และ Next.js ESLint plugin warning แม้ lint/build ผ่าน
- Evidence: npm run db:generate, npm run build output, package.json
- Impact/repro: future Prisma 7/Next upgrade มี migration work; Complexity S-M
- Fix: move Prisma config to prisma.config.ts and add supported Next ESLint integration; Complexity S-M
- UAT blocker: NO; Production blocker: NO

### AUD-P4-003 — internal naming/legacy copy ยังเหลือ

- Severity: P4
- Feature/problem: component/file name IirfaTicketPass และ footer URL legacy ยังไม่ใช้ Event TIRD consistently
- Evidence: src/components/ticket/iirfa-ticket-pass.tsx, src/app/ticket/[token]/page.tsx
- Impact/repro: ไม่กระทบ runtime แต่ทำให้ product language ไม่เป็นหนึ่งเดียว; Complexity S
- Fix: rename only after route/component references inventory; Complexity S
- UAT blocker: NO; Production blocker: NO

## Recommended UAT Scope

ต้องตั้ง scope เป็น IIRFA 2026 + SINGLE_ENTRY ก่อน:

1. Provision PostgreSQL + apply migration baseline + verify backup/restore.
2. Set AUTH_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_APP_URL, DEV_AUTH_BYPASS=false.
3. Create one Event with Asia/Bangkok times, one or more active Gate, and explicit check-in window.
4. Test SUPER_ADMIN, EVENT_ADMIN, EVENT_STAFF, VIEWER access separately.
5. Add one attendee, issue QR, open public pass, scan success, scan duplicate, cancel, expired, too early, too late, wrong event and inactive gate.
6. Import a bounded CSV/XLSX fixture, verify rejected rows and duplicate policy, then export and verify columns/filename.
7. Run 10 concurrent scans against the same ticket and assert exactly one accepted outcome for SINGLE_ENTRY.
8. Test scanner on HTTPS physical Android/iOS/desktop device, camera permission, torch fallback, reload, offline message and recovery.
9. Validate report counts against known fixture: registered, unique checked-in attendees, visits, duplicate scans, no-show and per-gate totals.

## Features to Disable for UAT

- MULTI_DAY until EventDay/session implementation exists
- REENTRY unless visit-count vs unique-attendee reporting is fixed and explicitly accepted
- Reactivate/regenerate of expired tickets until expiresAt policy is fixed
- Unbounded bulk import; use bounded fixture only
- Public event registration/public event page, because route is missing and no public data exposure scope was approved
- Offline check-in claims; treat scanner as online-only until durable queue/reconciliation exists
- Arbitrary external image URLs if event image policy is not approved

## Required Fixes Before UAT

- Resolve P0-001 and P0-002: DB, migrations, env validation and migration smoke.
- Turn off dev bypass and remove default seed password behavior from UAT.
- Fix P1-005 report authorization and P1-007 ticket expiry state.
- Freeze access mode to SINGLE_ENTRY; add explicit UAT feature flag/validation.
- Add 10-request concurrent integration test with PostgreSQL.
- Add basic API tests for auth, 401/403/404/422/429/500 and invalid CUID/status filters.
- Add camera/HTTPS manual test record and mobile viewport screenshots.
- Fix P2-005 report export before calling export accepted.

## Required Fixes Before Production

- All P0/P1 findings closed with evidence.
- Migration deploy, backup/restore, rollback and DB connection pool contract documented.
- Secret/env validation, login protection, password lifecycle and production seed lock.
- Idempotency/concurrency and EventDay/REENTRY semantics implemented or disabled permanently for this launch.
- Public ticket cache/privacy policy, no-store/noindex and graceful error boundary.
- Distributed rate limiting, health/readiness, request IDs, structured logs, alerts and redaction.
- Pagination/limits, import hardening, ticket delivery/history, Gate/device lifecycle and audit viewer.
- Docker/Vercel release path tested in preview with real PostgreSQL.
- Browser/mobile/camera test matrix and accessibility checks recorded.
- Apply new design tokens consistently without reducing operational contrast or touch targets.

## Suggested Implementation Order

### Phase 0 — Environment and release safety

Provision PostgreSQL, define environment schema, add readiness, create migration baseline, write seed guard, and make CI run generate/validate/migrate smoke/typecheck/lint/test/build

### Phase 1 — Domain and security hardening

Fix permission mismatch, auth hardening, status transition matrix, ticket expiry transaction, audit transaction coupling, request IDs and typed error paths

### Phase 2 — QR/check-in correctness

Decide SINGLE_ENTRY as UAT mode, add idempotency/concurrency test, then implement EventDay/session if MULTI_DAY/REENTRY is required; add ticket history/delivery state and scanner device identity

### Phase 3 — Operations/data scale

Pagination/cursor, bounded import with preview/duplicate policy, report export, recent check-in feed, Gate/device lifecycle, audit viewer, object storage policy

### Phase 4 — UI redesign using the new design source

Use D:\code internal TIRD\time worker\design.md as source of truth, but adapt it for an operational app:

1. Token layer: map #171717 ink, #fafafa canvas, #ffffff surface, #ebebeb hairline, #4d4d4d body, #888888 mute, semantic error/warning/link, 4px spacing and documented shadow/radius levels into globals.css/tailwind tokens. Remove raw hex from feature components.
2. Typography: use Geist if approved/licensed; otherwise Inter with the defined weights 400/500/600 and Geist Mono/JetBrains Mono for eyebrows, IDs, ticket numbers and technical labels. Keep body readable at 16px on mobile.
3. App shell: light canvas + white header/sidebar, compact 6–8px app controls, active left-edge ink indicator, mono section labels, one primary action per screen. Keep dark ink polarity only for deliberate scanner/hero surfaces.
4. Dashboard: one restrained hero band with the full mesh gradient at hero scale; stats become clean surface cards with hairline + stacked shadow; recent check-ins become real data, not decorative copy.
5. Event workspace: dense but breathable table/cards, tab-ghost navigation, clear status text/icon, responsive overflow strategy and server-side pagination.
6. Scanner: dedicated high-contrast dark/ink surface, 44px+ touch controls, clear success/duplicate/error result cards, no decorative gradient near the camera frame, and visible online/device state.
7. Public ticket: white/ink pass with technical mono metadata, privacy-safe print/share behavior, and no-store/noindex response headers.
8. Responsive/a11y gate: verify 375/430/768/1440, keyboard/focus, label association, contrast, screen reader summary, reduced motion, table alternatives and safe touch spacing.

Important design decision: the source document is marketing-first and recommends 96–192px section gaps; do not apply those gaps to scanner, attendee tables or check-in history. Use its visual restraint/tokens, not its marketing density, for operational pages.

### Phase 5 — Production rehearsal

Build Docker/Vercel artifact, run migration release job, preview with PostgreSQL, execute UAT matrix, run backup/restore drill, verify logs/health/alerts and record release/rollback decision

