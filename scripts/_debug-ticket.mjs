import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();
const token = "evt_7WovWIvtaUnIRe-peTb_5DVMDPRKRVZ4sOcJQLRIk0o";

try {
  const t = await prisma.ticket.findUnique({
    where: { qrTokenHash: createHash("sha256").update(token, "utf8").digest("hex") },
    include: { event: true },
  });
  if (!t) {
    console.log("TICKET NOT FOUND");
    process.exit(0);
  }
  const e = t.event;
  const fmt = (d) =>
    d
      ? new Intl.DateTimeFormat("th-TH", { dateStyle: "full", timeStyle: "long", timeZone: "Asia/Bangkok" }).format(d) +
        "  (ISO: " + d.toISOString() + ")"
      : "null";
  console.log("ticket:", t.ticketNumber, "| status:", t.status, "| checkedInAt:", fmt(t.checkedInAt));
  console.log("eventId:", e.id, "| name:", e.name, "| status:", e.status, "| accessMode:", e.accessMode);
  console.log("startAt:        ", fmt(e.startAt));
  console.log("endAt:          ", fmt(e.endAt));
  console.log("checkinOpenAt:  ", fmt(e.checkinOpenAt));
  console.log("checkinCloseAt: ", fmt(e.checkinCloseAt));
  const now = Date.now();
  console.log("server now ISO: ", new Date(now).toISOString(), "| Bangkok:", new Intl.DateTimeFormat("th-TH", { dateStyle: "full", timeStyle: "long", timeZone: "Asia/Bangkok" }).format(new Date(now)));
  console.log("now < openAt ?", now < e.checkinOpenAt.getTime(), "| now > closeAt ?", now > e.checkinCloseAt.getTime());
} finally {
  await prisma.$disconnect();
}