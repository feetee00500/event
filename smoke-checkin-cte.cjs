const fs = require("fs");
for (const f of [".env.uat.local", ".env.local", ".env"]) {
  if (fs.existsSync(f)) {
    for (const line of fs.readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  }
}
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const meta = { source: "qr", deviceId: "smoke-test" };
const checkedInAt = new Date();
const CTE = (ticketId, a, b) => `
  WITH claimed AS (
    UPDATE "Ticket" SET "status" = 'CHECKED_IN', "checkedInAt" = ${checkedInAt}::timestamptz
    WHERE "id" = ${ticketId} AND "status" IN (${a}, ${b})
    RETURNING "id"
  ),
  attendee AS (
    UPDATE "Attendee" SET "status" = 'CHECKED_IN'
    WHERE "id" = (SELECT "attendeeId" FROM claimed)
    RETURNING "id"
  ),
  logged AS (
    INSERT INTO "Checkin" ("eventId", "ticketId", "gateId", "scannedById", "deviceId", "result", "scannedAt", "ipAddress", "userAgent", "metadata", "createdAt")
    SELECT ${"event-id"}, "id", ${"gate-id"}, ${"scanned-by"}, ${null}, 'SUCCESS', ${checkedInAt}::timestamptz, ${null}, ${null}, ${JSON.stringify(meta)}::jsonb, ${checkedInAt}::timestamptz
    FROM claimed
    RETURNING "id"
  )
  SELECT (SELECT count(*)::int FROM claimed) AS claimed, (SELECT count(*)::int FROM attendee) AS attendee, (SELECT count(*)::int FROM logged) AS logged`;
(async () => {
  await prisma.$transaction(async (tx) => {
    const event = await tx.event.create({ data: { name: "__smoke__", venue: "__smoke__", startAt: new Date(), endAt: new Date(), checkinOpenAt: new Date("2020-01-01"), checkinCloseAt: new Date("2100-01-01"), status: "ACTIVE", accessMode: "SINGLE_ENTRY", createdById: "smoke" } });
    const attendee = await tx.attendee.create({ data: { eventId: event.id, firstName: "Smoke", lastName: "Test", status: "REGISTERED" } });
    const gate = await tx.gate.create({ data: { eventId: event.id, name: "Gate Smoke", isActive: true } });
    const ticket = await tx.ticket.create({ data: { eventId: event.id, attendeeId: attendee.id, ticketNumber: "__smoke__ticket__1", qrTokenHash: "__smoke__hash__1", status: "ACTIVE" } });
    const sql = CTE(ticket.id, "ACTIVE", "ACTIVE").replace("event-id", event.id).replace("gate-id", gate.id).replace("scanned-by", "user-a");
    const rows = await tx.$queryRaw(Prisma.sql([sql]));
    console.log("single-entry success:", JSON.stringify(rows));
    const ticket2 = await tx.ticket.create({ data: { eventId: event.id, attendeeId: attendee.id, ticketNumber: "__smoke__ticket__2", qrTokenHash: "__smoke__hash__2", status: "CHECKED_IN" } });
    const sql2 = CTE(ticket2.id, "ACTIVE", "ACTIVE").replace("event-id", event.id).replace("gate-id", gate.id).replace("scanned-by", "user-a");
    const rows2 = await tx.$queryRaw(Prisma.sql([sql2]));
    console.log("single-entry duplicate race (expect claimed=0):", JSON.stringify(rows2));
    const sql3 = CTE(ticket2.id, "ACTIVE", "CHECKED_IN").replace("event-id", event.id).replace("gate-id", gate.id).replace("scanned-by", "user-a");
    const rows3 = await tx.$queryRaw(Prisma.sql([sql3]));
    console.log("reentry allow (expect claimed=1):", JSON.stringify(rows3));
    const t = await tx.ticket.findUnique({ where: { id: ticket.id }, select: { status: true, checkedInAt: true } });
    const a = await tx.attendee.findUnique({ where: { id: attendee.id }, select: { status: true } });
    console.log("ticket after:", JSON.stringify(t), "attendee after:", JSON.stringify(a));
    const c = await tx.checkin.findMany({ where: { eventId: event.id } });
    console.log("checkins after:", JSON.stringify(c.map((x) => ({ result: x.result, scannedAt: x.scannedAt, metadata: x.metadata, deviceId: x.deviceId }))));
    throw new Error("rollback");
  }).catch((e) => {
    console.log("transaction:", e.message === "rollback" ? "ROLLED BACK OK (no data left)" : "FAILED: " + e.message);
    if (e.message !== "rollback") process.exitCode = 1;
  });
  await prisma.$disconnect();
})();
