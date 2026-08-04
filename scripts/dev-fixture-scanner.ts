/**
 * Dev-only fixture for manual scanner testing.
 *
 * Creates ONE event "[SCANNER-DEMO] Test Event" in the connected database
 * (intended for local/UAT only — NEVER Production) with two gates, a staff
 * assignment, and attendees/tickets covering every scan-result branch:
 * SUCCESS, ALREADY_CHECKED_IN, CANCELLED, EXPIRED, INVALID_TOKEN.
 *
 * Re-running the script replaces the previous demo event (deleteMany by name,
 * which cascades attendees/tickets/gates/check-ins/assignments).
 *
 * Run (from repo root, using the UAT env file as an example):
 *   node --env-file=.env.uat.local --import tsx scripts/dev-fixture-scanner.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createQrToken, hashQrToken, ticketUrl } from "../src/lib/qr";
import { createTicketNumber } from "../src/lib/tickets";

const prisma = new PrismaClient();
const EVENT_NAME = "[SCANNER-DEMO] Test Event";
const MARKER = "SCANNER-DEMO";
const now = new Date();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

type DemoAttendee = {
  firstName: string;
  lastName: string;
  attendeeStatus: "REGISTERED" | "QR_GENERATED" | "CHECKED_IN" | "CANCELLED";
  ticketType?: string;
  ticketStatus?: "ACTIVE" | "CHECKED_IN" | "CANCELLED" | "EXPIRED";
  expiresAt?: Date;
  cancelledAt?: Date;
  checkedInAt?: Date;
};

const demos: DemoAttendee[] = [
  // 1. พร้อมสแกน → SUCCESS
  { firstName: "สมชาย", lastName: "ใจดี", attendeeStatus: "QR_GENERATED", ticketType: "General", ticketStatus: "ACTIVE" },
  // 2. เข้าไปแล้ว → ALREADY_CHECKED_IN (มีประวัติ check-in สำเร็จแล้ว)
  { firstName: "สมหญิง", lastName: "รักดี", attendeeStatus: "CHECKED_IN", ticketType: "VIP", ticketStatus: "CHECKED_IN", checkedInAt: new Date(now.getTime() - 2 * HOUR) },
  // 3. บัตรถูกยกเลิก → CANCELLED
  { firstName: "นายดำ", lastName: "ใจเย็น", attendeeStatus: "CANCELLED", ticketType: "General", ticketStatus: "CANCELLED", cancelledAt: new Date(now.getTime() - HOUR) },
  // 4. บัตรหมดอายุ → EXPIRED
  { firstName: "นางแดง", lastName: "แสงจันทร์", attendeeStatus: "QR_GENERATED", ticketType: "General", ticketStatus: "EXPIRED", expiresAt: new Date(now.getTime() - HOUR) },
  // 5. ลงทะเบียนแต่ยังไม่มีบัตร → INVALID_TOKEN (สแกน QR ปลอม)
  { firstName: "เด็กชาย", lastName: "ขยัน", attendeeStatus: "REGISTERED" },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required — run with --env-file");
  if (process.env.NODE_ENV === "production") throw new Error("Fixture script must never run in Production");

  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  const superAdmin = await prisma.user.upsert({ where: { email: "superadmin@event-tird.local" }, update: {}, create: { name: "ผู้ดูแลระบบ", email: "superadmin@event-tird.local", passwordHash, role: "SUPER_ADMIN" } });
  const admin = await prisma.user.upsert({ where: { email: "admin@event-tird.local" }, update: {}, create: { name: "ผู้จัดงาน", email: "admin@event-tird.local", passwordHash, role: "EVENT_ADMIN" } });
  const staff = await prisma.user.upsert({ where: { email: "staff-a@event-tird.local" }, update: {}, create: { name: "เจ้าหน้าที่ A", email: "staff-a@event-tird.local", passwordHash, role: "EVENT_STAFF" } });

  // ลบ demo event เดิม (cascade ลบ attendees/tickets/gates/checkins/assignments/audit logs)
  const removed = await prisma.event.deleteMany({ where: { name: EVENT_NAME } });
  console.log(`Removed previous demo events: ${removed.count}`);

  const event = await prisma.event.create({
    data: {
      name: EVENT_NAME,
      venue: "Hall 1, IMPACT Muang Thong Thani",
      description: "ข้อมูลทดสอบสำหรับทดสอบ Scanner flow — สร้างโดย scripts/dev-fixture-scanner.ts",
      startAt: new Date(now.getTime() - DAY),
      endAt: new Date(now.getTime() + 7 * DAY),
      checkinOpenAt: new Date(now.getTime() - DAY),
      checkinCloseAt: new Date(now.getTime() + 7 * DAY),
      status: "ACTIVE",
      accessMode: "SINGLE_ENTRY",
      createdById: superAdmin.id,
    },
  });

  const [gateMain, gateVip] = await Promise.all([
    prisma.gate.create({ data: { eventId: event.id, name: "ประตูหลัก", isActive: true } }),
    prisma.gate.create({ data: { eventId: event.id, name: "ประตู VIP", isActive: true } }),
  ]);
  await prisma.eventAssignment.create({ data: { eventId: event.id, userId: staff.id, role: "EVENT_STAFF" } });
  await prisma.eventAssignment.create({ data: { eventId: event.id, userId: admin.id, role: "EVENT_ADMIN" } });

  const tickets: Array<{ index: number; ticketNumber: string; publicUrl: string }> = [];
  for (const [index, demo] of demos.entries()) {
    const n = index + 1;
    const attendee = await prisma.attendee.create({
      data: {
        eventId: event.id,
        title: "คุณ",
        firstName: demo.firstName,
        lastName: demo.lastName,
        email: `scanner-demo-${n}@example.test`,
        referenceCode: `${MARKER}-${n}`,
        status: demo.attendeeStatus,
      },
    });
    if (demo.ticketType && demo.ticketStatus) {
      const rawToken = createQrToken();
      const ticket = await prisma.ticket.create({
        data: {
          eventId: event.id,
          attendeeId: attendee.id,
          ticketNumber: createTicketNumber(),
          ticketType: demo.ticketType,
          qrTokenHash: hashQrToken(rawToken),
          status: demo.ticketStatus,
          expiresAt: demo.expiresAt ?? null,
          cancelledAt: demo.cancelledAt ?? null,
          checkedInAt: demo.checkedInAt ?? null,
        },
      });
      if (demo.ticketStatus === "CHECKED_IN" && demo.checkedInAt) {
        await prisma.checkin.create({
          data: {
            eventId: event.id,
            ticketId: ticket.id,
            gateId: gateMain.id,
            scannedById: staff.id,
            deviceId: "fixture",
            result: "SUCCESS",
            scannedAt: demo.checkedInAt,
            metadata: { source: "fixture" },
          },
        });
      }
      tickets.push({ index: n, ticketNumber: ticket.ticketNumber, publicUrl: ticketUrl(rawToken) });
    }
  }

  const fakeToken = createQrToken();
  console.log("\n=== SCANNER DEMO FIXTURE READY ===");
  console.log(`Event ID: ${event.id} (${EVENT_NAME})`);
  console.log(`Event URL (admin): http://localhost:3000/admin/events/${event.id}`);
  console.log(`Scanner URL: http://localhost:3000/scanner/${event.id}`);
  console.log(`Gates: ${gateMain.name} / ${gateVip.name}`);
  console.log(`Staff login: staff-a@event-tird.local / ChangeMe123! (EVENT_STAFF assigned)`);
  console.log("\n--- Test cases (สแกน URL เหล่านี้จากมือถืออีกเครื่อง หรือเปิด /ticket/<token>) ---");
  for (const ticket of tickets) {
    const expectation = { 1: "SUCCESS — เข้างานได้", 2: "ALREADY_CHECKED_IN — สแกนซ้ำ", 3: "CANCELLED — บัตรถูกยกเลิก", 4: "EXPIRED — บัตรหมดอายุ" }[ticket.index] ?? "";
    console.log(`${ticket.index}. ${ticket.ticketNumber} (${expectation})`);
    console.log(`   ${ticket.publicUrl}`);
  }
  console.log(`5. ไม่มีบัตร — สแกน QR ปลอมนี้ (คาดว่า INVALID_TOKEN):`);
  console.log(`   http://localhost:3000/ticket/${fakeToken}`);
  console.log(`   (หรือ manual: กรอก ticketNumber ที่ไม่มีอยู่จริง)`);
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
