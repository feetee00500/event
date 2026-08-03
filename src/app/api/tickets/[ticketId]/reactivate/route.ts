import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser, requireEvent } from "@/lib/guards";
import { apiError } from "@/lib/http";

type Context = { params: Promise<{ ticketId: string }> };

export async function POST(_request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const { ticketId } = await params;
    const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!existing) return NextResponse.json({ error: "ไม่พบ Ticket" }, { status: 404 });
    await requireEvent(user, existing.eventId, "tickets:write");
    const ticket = await prisma.ticket.update({ where: { id: ticketId }, data: { status: "ACTIVE", cancelledAt: null } });
    await prisma.attendee.update({ where: { id: ticket.attendeeId }, data: { status: "QR_GENERATED" } });
    await prisma.auditLog.create({ data: { userId: user.id, eventId: existing.eventId, action: "TICKET_REACTIVATED", entityType: "Ticket", entityId: ticketId } });
    return NextResponse.json({ ticket });
  } catch (error) {
    return apiError(error);
  }
}
