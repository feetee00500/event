import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Seed data is disabled in production");

  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  await prisma.user.upsert({ where: { email: "superadmin@event-tird.local" }, update: {}, create: { name: "ผู้ดูแลระบบ", email: "superadmin@event-tird.local", passwordHash, role: "SUPER_ADMIN" } });
  await prisma.user.upsert({ where: { email: "admin@event-tird.local" }, update: {}, create: { name: "ผู้จัดงาน", email: "admin@event-tird.local", passwordHash, role: "EVENT_ADMIN" } });
  await prisma.user.upsert({ where: { email: "staff-a@event-tird.local" }, update: {}, create: { name: "เจ้าหน้าที่ A", email: "staff-a@event-tird.local", passwordHash, role: "EVENT_STAFF" } });
  await prisma.user.upsert({ where: { email: "staff-b@event-tird.local" }, update: {}, create: { name: "เจ้าหน้าที่ B", email: "staff-b@event-tird.local", passwordHash, role: "EVENT_STAFF" } });
  await prisma.user.upsert({ where: { email: "viewer@event-tird.local" }, update: {}, create: { name: "ผู้ดูรายงาน", email: "viewer@event-tird.local", passwordHash, role: "VIEWER" } });

  console.log("Seed complete. No demo events were created.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
