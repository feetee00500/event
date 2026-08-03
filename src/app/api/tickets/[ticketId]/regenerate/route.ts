import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser, requireEvent } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { createQrToken, hashQrToken, ticketUrl } from "@/lib/qr";

type Context = { params: Promise<{ ticketId: string }> };

export async function POST(_request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const { ticketId } = await params;
    const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!existing) return NextResponse.json({ error: "ไม่พบ Ticket" }, { status: 404 });
    await requireEvent(user, existing.eventId, "tickets:write");
    const rawToken = createQrToken();
    const ticket = await prisma.ticket.update({ where: { id: ticketId }, data: { qrTokenHash: hashQrToken(rawToken), issuedAt: new Date(), status: "ACTIVE", cancelledAt: null, checkedInAt: null } });
    await prisma.attendee.update({ where: { id: ticket.attendeeId }, data: { status: "QR_GENERATED" } });
    await prisma.auditLog.create({ data: { userId: user.id, eventId: existing.eventId, action: "TICKET_REGENERATED", entityType: "Ticket", entityId: ticketId } });
    return NextResponse.json({ ticket: { id: ticket.id, ticketNumber: ticket.ticketNumber, publicToken: rawToken, publicUrl: ticketUrl(rawToken) } });
  } catch (error) {
    return apiError(error);
  }
}
