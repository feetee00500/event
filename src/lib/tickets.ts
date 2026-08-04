import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { createQrToken, hashQrToken, ticketUrl } from "@/lib/qr";

export function createTicketNumber(): string {
  const year = new Date().getFullYear();
  return `EVT-${year}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function issueTicket(tx: Prisma.TransactionClient, input: { eventId: string; attendeeId: string; ticketType: string; status?: "ACTIVE" | "CANCELLED"; updateAttendeeStatus?: boolean }) {
  const rawToken = createQrToken();
  const ticket = await tx.ticket.create({ data: { eventId: input.eventId, attendeeId: input.attendeeId, ticketNumber: createTicketNumber(), ticketType: input.ticketType, qrTokenHash: hashQrToken(rawToken), status: input.status ?? "ACTIVE" } });
  if (input.updateAttendeeStatus ?? true) {
    await tx.attendee.update({ where: { id: input.attendeeId }, data: { status: ticket.status === "CANCELLED" ? "CANCELLED" : "QR_GENERATED" } });
  }
  return { ticket, publicToken: rawToken, publicUrl: ticketUrl(rawToken) };
}
