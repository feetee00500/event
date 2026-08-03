# Event TIRD QR Check-in — Design System

Event TIRD is an internal event operations platform for organizer teams, check-in staff, and attendees. The current product is scoped to IIRFA 2026, with the UI structured so a future event workspace can be added without weakening permissions or QR security.

## Brand Foundation

- Personality: precise, calm, credible, operational, and human at the point of entry.
- Brand expression: Event TIRD uses the navy/teal visual language, but uses editorial whitespace, thin rules, compact data labels, and clear state copy rather than decorative effects.
- Logo usage: use the Event TIRD wordmark treatment in the application shell; never distort or recolor an official supplied asset. If an official TIRD asset is supplied, keep clear space around it and use it only on branded surfaces.
- Primary: `#0D8F83` teal for actions and current state.
- Navy: `#002756` for structure, scanner surfaces, public-ticket header, and high-contrast emphasis.
- Signal: `#22C7AE` for live indicators and progress.
- Neutral: canvas `#EEF4F7`, paper `#F5FAF9`, surface `#FFFFFF`, line `#CBD8E4`, muted `#5F7386`, ink `#002756`.
- Semantic: success `#087A6F`, warning `#9A6700`, danger `#B42318`, information `#146C94`.
- Status is never communicated by color alone; pair color with a label and, where useful, an icon.

## Typography

- Font family: `Kanit` when available, then `Noto Sans Thai`, `Leelawadee UI`, and system sans-serif fallbacks.
- Display: 48–72px, weight 600–700, reserved for a single page or project statement.
- Page title: 32–40px desktop, 28–32px mobile, weight 600.
- Section title: 20–24px, weight 600.
- Card title: 16–18px, weight 600–700.
- Body: 16px, line-height 1.6; keep Thai text to a readable measure.
- Caption/label: 12–14px; labels are explicit and never replaced by placeholder-only text.
- Numeric KPI: IBM Plex Mono or a tabular system mono, weight 600; numbers should not jump as values update.
- Button text: 14–16px, weight 600; primary action uses one clear verb.

## Spacing

Use the shared 4/8 rhythm: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.

- Page gutter: 16px mobile, 24px tablet, 32px desktop.
- Section gap: 24px; major region gap: 32–48px.
- Card padding: 20px mobile, 24px desktop.
- Minimum interactive target: 44×44px.

## Radius

- small: 4px for compact controls and tags.
- medium: 8px for inputs and row actions.
- large: 12px for cards and event surfaces.
- card: 12px; dialog: 12px; pill: 999px.

## Shadows

- subtle: `0 1px 2px rgba(0, 39, 86, .05)`.
- card: `0 1px 2px rgba(0, 39, 86, .05), 0 8px 24px rgba(0, 39, 86, .04)`.
- floating: `0 8px 24px rgba(0, 39, 86, .12)`.
- dialog: `0 20px 60px rgba(0, 39, 86, .20)`.
- focus: 2px primary ring with a visible offset.

## Layout and Information Architecture

- Max content width: 1320px.
- Desktop sidebar: 288px; sticky header: 64px.
- Desktop primary navigation: ภาพรวมระบบ, กิจกรรมทั้งหมด, สแกนเข้างาน, ผู้ใช้งาน.
- Event workspace navigation: ภาพรวม, ผู้เข้าร่วม, บัตรเข้างาน, จุดเข้างาน, ประวัติสแกน, รายงาน, ตั้งค่างาน.
- Breadcrumbs appear on deep event routes so the user always has a predictable way back.
- Mobile uses a four-item bottom navigation for top-level operations plus a drawer for the full admin menu. Public ticket pages never render admin navigation.
- Scanner is operational-first: event/gate context, camera, manual fallback, connectivity, last scan, and next-scan action appear before secondary settings.
- Public information pages are read-only until a real registration API exists; do not expose fake registration or payment flows.

## Components

- Button: one primary action per region; secondary, ghost, and danger variants remain visually distinct. Disable during async work and show progress.
- Input/Select/Date time: visible label, helper/error text, 44px minimum height, semantic input type, focus-visible ring.
- Search/Filter bar: search, filters, result count, clear state, and view/sort controls stay together.
- Tabs: horizontal scroll on small screens, active state uses border + text, not color alone.
- Badge: concise Thai status label; reuse `StatusBadge` for event, ticket, attendee, and check-in states.
- Event card: cover or intentional placeholder, status, name, date/time, venue, registration/check-in counts, progress, and one obvious open action.
- Ticket card/pass: QR quiet zone, holder, event, ticket type, ticket number, status, and practical actions such as copy, download, and print.
- KPI card: compact, label-first, tabular number, supporting detail; never push operational content below the fold.
- Table: sticky header where useful, horizontal scroll fallback, mobile card alternative for dense attendee data, and clear empty/error states.
- Empty/loading/error: explain what is missing and provide a recovery action; never render fabricated counts.
- Dialog/drawer: close button, Escape support, strong title, destructive confirmation copy, and mobile-friendly bottom-sheet behavior.
- Form sections/stepper: group basic data, date/location, registration/check-in, presentation, and review; retain Save Draft and clear validation summary.
- Scanner result: success, duplicate, invalid, cancelled, expired, too early/late, and wrong event have distinct icon, heading, reason, and next action.
- Timeline/report: label data, use accessible colors, show a table or text summary alongside charts, and show a meaningful empty state.

## Accessibility

- Maintain WCAG AA contrast: 4.5:1 for body text and 3:1 for large text/icons.
- All interactive controls support keyboard focus and have a visible `focus-visible` state.
- Icon-only controls require an accessible Thai label; structural icons come from Lucide, never emoji.
- Errors are announced with `role="alert"` and placed next to the field or action that needs correction.
- Modal focus order must be understandable; Escape and visible close actions are always available.
- Reduced motion disables decorative movement and shortens transitions.
- QR status is written as text and QR itself keeps a white quiet zone; no color-only state.
- Do not block browser zoom; test 375px, 430px, 768px, 1280px, and 1440px widths.

## Performance and Security Guardrails

- Keep scanner libraries dynamically imported only on scanner routes.
- Use dimensions/aspect ratios for event covers and QR to prevent layout shift.
- Prefer server components for read-only pages and pass only the minimum serializable data to client components.
- Keep database timestamps in UTC and display in `Asia/Bangkok`.
- Preserve server-side authorization, event scoping, QR hashing, rate limits, audit logs, and the atomic check-in transaction.
- Never log or expose raw QR tokens beyond the existing authorized generation response.
- Do not add mock records to production flows; missing data is represented with an empty or unavailable state.