import type { CheckinResult, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashQrToken } from "@/lib/qr";
import { isWithinWindow } from "@/lib/timezone";

export type CheckinInput = { token: string; ticketNumber?: string; eventId: string; gateId: string; userId: string; deviceId?: string; ipAddress?: string; userAgent?: string };
export type CheckinResponse =
  | { success: true; status: "CHECKED_IN"; attendee: { id: string; name: string; ticketType: string; ticketNumber: string }; checkedInAt: string; gate: { id: string; name: string } }
  | { success: false; status: CheckinResult; message: string; firstCheckedInAt?: string; gateName?: string; checkinOpenAt?: string; checkinCloseAt?: string };

function failureMessage(result: CheckinResult): string { return { INVALID_TOKEN: "ไม่พบ Ticket ที่ใช้งานได้", ALREADY_CHECKED_IN: "QR Code นี้ถูกใช้งานแล้ว", CANCELLED: "บัตรนี้ถูกยกเลิก ไม่อนุญาตให้เข้า", EXPIRED: "บัตรนี้หมดอายุแล้ว", TOO_EARLY: "ยังไม่เปิดให้ Check-in", TOO_LATE: "ปิดการ Check-in แล้ว", EVENT_MISMATCH: "QR Code นี้ไม่ใช่ของ Event ที่กำลังสแกน", MANUAL_CHECKIN: "บันทึกการ Check-in ด้วยตนเองแล้ว", SUCCESS: "Check-in สำเร็จ" }[result]; }
function failure(result: CheckinResult, extra: Partial<Extract<CheckinResponse, { success: false }>> = {}): CheckinResponse { return { success: false, status: result, message: failureMessage(result), ...extra }; }

function checkinLogData(input: CheckinInput, eventId: string, result: CheckinResult, meta: Prisma.InputJsonObject, ticketId?: string, gateId?: string, checkedInAt?: Date): Prisma.CheckinCreateInput {
  return { event: { connect: { id: eventId } }, ticket: ticketId ? { connect: { id: ticketId } } : undefined, gate: gateId ? { connect: { id: gateId } } : undefined, scannedBy: { connect: { id: input.userId } }, deviceId: input.deviceId, result, scannedAt: checkedInAt, ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: meta };
}

export async function processCheckin(input: CheckinInput): Promise<CheckinResponse> {
  const tokenHash = input.ticketNumber ? undefined : hashQrToken(input.token);
  const [event, ticket] = await Promise.all([
    prisma.event.findUnique({ where: { id: input.eventId }, select: { id: true, status: true, accessMode: true, checkinOpenAt: true, checkinCloseAt: true, gates: { where: { id: input.gateId, isActive: true }, take: 1, select: { id: true, name: true } } } }),
    prisma.ticket.findUnique({ where: input.ticketNumber ? { ticketNumber: input.ticketNumber } : { qrTokenHash: tokenHash }, select: { id: true, eventId: true, attendeeId: true, ticketNumber: true, ticketType: true, status: true, expiresAt: true, attendee: { select: { id: true, firstName: true, lastName: true } } } }),
  ]);
  if (!event) return failure("INVALID_TOKEN");
  const gate = event.gates[0];
  if (!gate) return failure("EVENT_MISMATCH");
  const now = new Date();
  const meta: Prisma.InputJsonObject = { source: input.ticketNumber ? "manual" : "qr", deviceId: input.deviceId ?? "" };
  if (event.status === "CANCELLED" || event.status === "COMPLETED") return failure("TOO_LATE");
  if (event.status === "DRAFT") return failure("TOO_EARLY");
  if (!ticket) {
    await prisma.checkin.create({ data: checkinLogData(input, event.id, "INVALID_TOKEN", meta, undefined, gate.id) });
    return failure("INVALID_TOKEN");
  }
  if (ticket.eventId !== event.id) {
    await prisma.checkin.create({ data: checkinLogData(input, event.id, "EVENT_MISMATCH", meta, ticket.id, gate.id) });
    return failure("EVENT_MISMATCH");
  }
  const windowResult = isWithinWindow(now, event.checkinOpenAt, event.checkinCloseAt);
  if (windowResult) {
    await prisma.checkin.create({ data: checkinLogData(input, event.id, windowResult, meta, ticket.id, gate.id) });
    return failure(windowResult, { checkinOpenAt: event.checkinOpenAt.toISOString(), checkinCloseAt: event.checkinCloseAt.toISOString() });
  }
  const ticketExpired = Boolean(ticket.expiresAt && ticket.expiresAt < now);
  if (ticketExpired && ticket.status === "ACTIVE") await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "EXPIRED" } });
  if (ticketExpired || ticket.status === "EXPIRED") {
    await prisma.checkin.create({ data: checkinLogData(input, event.id, "EXPIRED", meta, ticket.id, gate.id) });
    return failure("EXPIRED");
  }
  if (ticket.status === "CANCELLED") {
    await prisma.checkin.create({ data: checkinLogData(input, event.id, "CANCELLED", meta, ticket.id, gate.id) });
    return failure("CANCELLED");
  }
  if (ticket.status === "CHECKED_IN" && event.accessMode !== "REENTRY") {
    const [firstCheckin] = await Promise.all([
      prisma.checkin.findFirst({ where: { ticketId: ticket.id, result: "SUCCESS" }, orderBy: { scannedAt: "asc" }, select: { scannedAt: true, gate: { select: { name: true } } } }),
      prisma.checkin.create({ data: checkinLogData(input, event.id, "ALREADY_CHECKED_IN", meta, ticket.id, gate.id) }),
    ]);
    return failure("ALREADY_CHECKED_IN", { firstCheckedInAt: firstCheckin?.scannedAt.toISOString(), gateName: firstCheckin?.gate?.name });
  }
  const checkedInAt = now;
  const allowed = event.accessMode === "REENTRY" ? ["ACTIVE", "CHECKED_IN"] : ["ACTIVE", "ACTIVE"];
  const rows = await prisma.$queryRaw<{ claimed: number }[]>`
    WITH claimed AS (
      UPDATE "Ticket" SET "status" = 'CHECKED_IN', "checkedInAt" = ${checkedInAt}::timestamptz
      WHERE "id" = ${ticket.id} AND "status" IN (${allowed[0]}, ${allowed[1]})
      RETURNING "id"
    ),
    attendee AS (
      UPDATE "Attendee" SET "status" = 'CHECKED_IN'
      WHERE "id" = (SELECT "attendeeId" FROM claimed)
      RETURNING "id"
    ),
    logged AS (
      INSERT INTO "Checkin" ("eventId", "ticketId", "gateId", "scannedById", "deviceId", "result", "scannedAt", "ipAddress", "userAgent", "metadata", "createdAt")
      SELECT ${event.id}, "id", ${gate.id}, ${input.userId}, ${input.deviceId ?? null}, 'SUCCESS', ${checkedInAt}::timestamptz, ${input.ipAddress ?? null}, ${input.userAgent ?? null}, ${JSON.stringify(meta)}::jsonb, ${checkedInAt}::timestamptz
      FROM claimed
      RETURNING "id"
    )
    SELECT (SELECT count(*)::int FROM claimed) AS claimed
  `;
  if (rows[0]?.claimed !== 1) {
    const [latest, firstCheckin] = await Promise.all([
      prisma.ticket.findUnique({ where: { id: ticket.id }, select: { status: true } }),
      prisma.checkin.findFirst({ where: { ticketId: ticket.id, result: "SUCCESS" }, orderBy: { scannedAt: "asc" }, select: { scannedAt: true, gate: { select: { name: true } } } }),
    ]);
    if (latest?.status === "CANCELLED") return failure("CANCELLED");
    if (latest?.status === "EXPIRED") return failure("EXPIRED");
    await prisma.checkin.create({ data: checkinLogData(input, event.id, "ALREADY_CHECKED_IN", meta, ticket.id, gate.id) });
    return failure("ALREADY_CHECKED_IN", { firstCheckedInAt: firstCheckin?.scannedAt.toISOString(), gateName: firstCheckin?.gate?.name });
  }
  return { success: true, status: "CHECKED_IN", attendee: { id: ticket.attendee.id, name: `${ticket.attendee.firstName} ${ticket.attendee.lastName}`, ticketType: ticket.ticketType, ticketNumber: ticket.ticketNumber }, checkedInAt: checkedInAt.toISOString(), gate: { id: gate.id, name: gate.name } };
}

export async function processManualCheckin(input: Omit<CheckinInput, "token"> & { ticketNumber: string }): Promise<CheckinResponse> { return processCheckin({ ...input, token: "manual" }); }
