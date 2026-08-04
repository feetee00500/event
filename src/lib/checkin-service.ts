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

export async function processCheckin(input: CheckinInput): Promise<CheckinResponse> {
  const tokenHash = input.ticketNumber ? undefined : hashQrToken(input.token);
  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: input.eventId }, select: { id: true, status: true, accessMode: true, checkinOpenAt: true, checkinCloseAt: true, gates: { where: { id: input.gateId, isActive: true }, take: 1, select: { id: true, name: true } } } });
    if (!event) return failure("INVALID_TOKEN");
    const now = new Date();
    const gate = event.gates[0];
    if (!gate) return failure("EVENT_MISMATCH");
    if (event.status === "CANCELLED" || event.status === "COMPLETED") return failure("TOO_LATE");
    if (event.status === "DRAFT") return failure("TOO_EARLY");

    const ticket = await tx.ticket.findUnique({ where: input.ticketNumber ? { ticketNumber: input.ticketNumber } : { qrTokenHash: tokenHash }, select: { id: true, eventId: true, attendeeId: true, ticketNumber: true, ticketType: true, status: true, expiresAt: true, attendee: { select: { id: true, firstName: true, lastName: true } } } });
    const meta: Prisma.InputJsonObject = { source: input.ticketNumber ? "manual" : "qr", deviceId: input.deviceId ?? "" };
    if (!ticket) {
      await tx.checkin.create({ data: { eventId: event.id, gateId: gate.id, scannedById: input.userId, deviceId: input.deviceId, result: "INVALID_TOKEN", ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: meta } });
      return failure("INVALID_TOKEN");
    }
    if (ticket.eventId !== event.id) {
      await tx.checkin.create({ data: { eventId: event.id, ticketId: ticket.id, gateId: gate.id, scannedById: input.userId, deviceId: input.deviceId, result: "EVENT_MISMATCH", ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: meta } });
      return failure("EVENT_MISMATCH");
    }
    const windowResult = isWithinWindow(now, event.checkinOpenAt, event.checkinCloseAt);
    if (windowResult) {
      await tx.checkin.create({ data: { eventId: event.id, ticketId: ticket.id, gateId: gate.id, scannedById: input.userId, deviceId: input.deviceId, result: windowResult, ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: meta } });
      return failure(windowResult, { checkinOpenAt: event.checkinOpenAt.toISOString(), checkinCloseAt: event.checkinCloseAt.toISOString() });
    }
    const ticketExpired = Boolean(ticket.expiresAt && ticket.expiresAt < now);
    if (ticketExpired && ticket.status === "ACTIVE") await tx.ticket.update({ where: { id: ticket.id }, data: { status: "EXPIRED" } });
    if (ticketExpired || ticket.status === "EXPIRED") {
      await tx.checkin.create({ data: { eventId: event.id, ticketId: ticket.id, gateId: gate.id, scannedById: input.userId, deviceId: input.deviceId, result: "EXPIRED", ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: meta } });
      return failure("EXPIRED");
    }
    if (ticket.status === "CANCELLED") {
      await tx.checkin.create({ data: { eventId: event.id, ticketId: ticket.id, gateId: gate.id, scannedById: input.userId, deviceId: input.deviceId, result: "CANCELLED", ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: meta } });
      return failure("CANCELLED");
    }
    if (ticket.status === "CHECKED_IN" && event.accessMode !== "REENTRY") {
      const firstCheckin = await tx.checkin.findFirst({ where: { ticketId: ticket.id, result: "SUCCESS" }, orderBy: { scannedAt: "asc" }, select: { scannedAt: true, gate: { select: { name: true } } } });
      await tx.checkin.create({ data: { eventId: event.id, ticketId: ticket.id, gateId: gate.id, scannedById: input.userId, deviceId: input.deviceId, result: "ALREADY_CHECKED_IN", ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: meta } });
      return failure("ALREADY_CHECKED_IN", { firstCheckedInAt: firstCheckin?.scannedAt.toISOString(), gateName: firstCheckin?.gate?.name });
    }
    const checkedInAt = now;
    const updated = await tx.ticket.updateMany({ where: { id: ticket.id, status: event.accessMode === "REENTRY" ? { in: ["ACTIVE", "CHECKED_IN"] } : "ACTIVE" }, data: { status: "CHECKED_IN", checkedInAt } });
    if (updated.count !== 1) {
      const latest = await tx.ticket.findUnique({ where: { id: ticket.id }, select: { status: true } });
      if (latest?.status === "CANCELLED") return failure("CANCELLED");
      if (latest?.status === "EXPIRED") return failure("EXPIRED");
      const firstCheckin = await tx.checkin.findFirst({ where: { ticketId: ticket.id, result: "SUCCESS" }, orderBy: { scannedAt: "asc" }, select: { scannedAt: true, gate: { select: { name: true } } } });
      await tx.checkin.create({ data: { eventId: event.id, ticketId: ticket.id, gateId: gate.id, scannedById: input.userId, deviceId: input.deviceId, result: "ALREADY_CHECKED_IN", ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: meta } });
      return failure("ALREADY_CHECKED_IN", { firstCheckedInAt: firstCheckin?.scannedAt.toISOString(), gateName: firstCheckin?.gate?.name });
    }
    await tx.attendee.update({ where: { id: ticket.attendeeId }, data: { status: "CHECKED_IN" } });
    await tx.checkin.create({ data: { eventId: event.id, ticketId: ticket.id, gateId: gate.id, scannedById: input.userId, deviceId: input.deviceId, result: "SUCCESS", scannedAt: checkedInAt, ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: meta } });
    return { success: true, status: "CHECKED_IN", attendee: { id: ticket.attendee.id, name: `${ticket.attendee.firstName} ${ticket.attendee.lastName}`, ticketType: ticket.ticketType, ticketNumber: ticket.ticketNumber }, checkedInAt: checkedInAt.toISOString(), gate: { id: gate.id, name: gate.name } };
  });
}

export async function processManualCheckin(input: Omit<CheckinInput, "token"> & { ticketNumber: string }): Promise<CheckinResponse> { return processCheckin({ ...input, token: "manual" }); }
