import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createQrToken, hashQrToken } from "../src/lib/qr";
import { createTicketNumber } from "../src/lib/tickets";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Seed data is disabled in production");
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  const superAdmin = await prisma.user.upsert({ where: { email: "superadmin@event-tird.local" }, update: {}, create: { name: "ผู้ดูแลระบบ", email: "superadmin@event-tird.local", passwordHash, role: "SUPER_ADMIN" } });
  const eventAdmin = await prisma.user.upsert({ where: { email: "admin@event-tird.local" }, update: {}, create: { name: "ผู้จัดงานตัวอย่าง", email: "admin@event-tird.local", passwordHash, role: "EVENT_ADMIN" } });
  const staffA = await prisma.user.upsert({ where: { email: "staff-a@event-tird.local" }, update: {}, create: { name: "เจ้าหน้าที่ A", email: "staff-a@event-tird.local", passwordHash, role: "EVENT_STAFF" } });
  const staffB = await prisma.user.upsert({ where: { email: "staff-b@event-tird.local" }, update: {}, create: { name: "เจ้าหน้าที่ B", email: "staff-b@event-tird.local", passwordHash, role: "EVENT_STAFF" } });
  const viewer = await prisma.user.upsert({ where: { email: "viewer@event-tird.local" }, update: {}, create: { name: "ผู้ดูรายงาน", email: "viewer@event-tird.local", passwordHash, role: "VIEWER" } });

  const now = new Date();
  const activeStart = new Date(now.getTime() - 60 * 60 * 1000);
  const activeEnd = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const activeOpen = new Date(now.getTime() - 30 * 60 * 1000);
  const activeClose = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const upcomingStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingEnd = new Date(upcomingStart.getTime() + 8 * 60 * 60 * 1000);

  const activeEvent = await prisma.event.create({ data: { name: "TIRD Product Community Day", description: "งานพบปะชุมชนผลิตภัณฑ์สำหรับทีมและพาร์ตเนอร์", venue: "True Digital Park, Bangkok", startAt: activeStart, endAt: activeEnd, checkinOpenAt: activeOpen, checkinCloseAt: activeClose, status: "ACTIVE", accessMode: "SINGLE_ENTRY", createdById: eventAdmin.id } });
  const upcomingEvent = await prisma.event.create({ data: { name: "Future Makers Summit 2026", description: "เวทีแบ่งปันแนวคิดและเทคโนโลยีสำหรับผู้สร้างอนาคต", venue: "Queen Sirikit National Convention Center", startAt: upcomingStart, endAt: upcomingEnd, checkinOpenAt: new Date(upcomingStart.getTime() - 60 * 60 * 1000), checkinCloseAt: new Date(upcomingEnd.getTime() - 60 * 60 * 1000), status: "PUBLISHED", accessMode: "REENTRY", createdById: eventAdmin.id } });

  await prisma.eventAssignment.createMany({ data: [
    { eventId: activeEvent.id, userId: eventAdmin.id, role: "EVENT_ADMIN" },
    { eventId: activeEvent.id, userId: staffA.id, role: "EVENT_STAFF" },
    { eventId: activeEvent.id, userId: staffB.id, role: "EVENT_STAFF" },
    { eventId: activeEvent.id, userId: viewer.id, role: "VIEWER" },
    { eventId: upcomingEvent.id, userId: eventAdmin.id, role: "EVENT_ADMIN" },
    { eventId: upcomingEvent.id, userId: staffA.id, role: "EVENT_STAFF" },
    { eventId: upcomingEvent.id, userId: viewer.id, role: "VIEWER" },
  ] });
  const activeGate = await prisma.gate.create({ data: { eventId: activeEvent.id, name: "Gate A", location: "ทางเข้าหลัก" } });
  await prisma.gate.create({ data: { eventId: activeEvent.id, name: "Gate B", location: "ลานจอดรถ" } });
  await prisma.gate.create({ data: { eventId: upcomingEvent.id, name: "Main Gate", location: "Lobby" } });

  const names = ["สมชาย ใจดี", "อรทัย แสงทอง", "ธนกร วัฒนะ", "ณัฐชา ศรีสุข", "พิมพ์ชนก วงศ์ดี", "กิตติพงศ์ รุ่งเรือง", "ชลธิชา มั่นคง", "ภูริณัฐ เกียรติศักดิ์", "ศศิธร นาคิน", "ภาคภูมิ อินทร์แก้ว", "ปวีณา คงมั่น", "วรพล ชาญชัย", "กมลชนก ตั้งใจ", "อาทิตย์ สุขสันต์", "นภัสสร พรหมรักษ์", "ภัทรพล วิไล", "กัญญารัตน์ สกุลไทย", "ธีรภัทร์ รัตนวงศ์", "ชนาธิป พูนผล", "รินรดา บุญมี"];
  for (const [index, fullName] of names.entries()) {
    const [firstName, lastName] = fullName.split(" ");
    const attendee = await prisma.attendee.create({ data: { eventId: activeEvent.id, firstName, lastName, email: `attendee${index + 1}@example.local`, company: index % 2 ? "TIRD Partner" : "TIRD Team", referenceCode: `REG-${String(index + 1).padStart(4, "0")}` } });
    const rawToken = createQrToken();
    const ticket = await prisma.ticket.create({ data: { eventId: activeEvent.id, attendeeId: attendee.id, ticketNumber: createTicketNumber(), ticketType: index < 4 ? "VIP" : index < 7 ? "Staff" : "General", qrTokenHash: hashQrToken(rawToken), status: "ACTIVE" } });
    if (index < 3) {
      const checkedInAt = new Date(now.getTime() - (index + 1) * 10 * 60 * 1000);
      await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "CHECKED_IN", checkedInAt } });
      await prisma.attendee.update({ where: { id: attendee.id }, data: { status: "CHECKED_IN" } });
      await prisma.checkin.create({ data: { eventId: activeEvent.id, ticketId: ticket.id, gateId: activeGate.id, scannedById: staffA.id, result: "SUCCESS", scannedAt: checkedInAt } });
    } else if (index === 3) {
      await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "CANCELLED", cancelledAt: now } });
      await prisma.attendee.update({ where: { id: attendee.id }, data: { status: "CANCELLED" } });
    } else {
      await prisma.attendee.update({ where: { id: attendee.id }, data: { status: "QR_GENERATED" } });
    }
  }
  console.log("Seed complete. Development users use password: ChangeMe123!");
  void superAdmin;
  void (activeEvent as { id: string });
  void (upcomingEvent as { id: string });
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
