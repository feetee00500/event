import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser, requireEvent } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { issueTicket } from "@/lib/tickets";

type Context = { params: Promise<{ eventId: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const { eventId } = await params;
    await requireEvent(user, eventId, "tickets:write");
    const body = (await request.json().catch(() => ({}))) as { attendeeIds?: unknown };
    const attendeeIds = Array.isArray(body.attendeeIds) ? body.attendeeIds.filter((value): value is string => typeof value === "string") : [];
    const attendees = await prisma.attendee.findMany({ where: { eventId, ...(attendeeIds.length ? { id: { in: attendeeIds } } : {}) }, include: { tickets: { orderBy: { createdAt: "desc" }, take: 1 } } });
    const generated: Array<{ attendeeId: string; ticketNumber: string; publicToken: string; publicUrl: string }> = [];
    for (const attendee of attendees) {
      const result = await prisma.$transaction(async (tx) => {
        const oldTicket = attendee.tickets[0];
        if (oldTicket) await tx.ticket.update({ where: { id: oldTicket.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
        return issueTicket(tx, { eventId, attendeeId: attendee.id, ticketType: oldTicket?.ticketType ?? "General" });
      });
      generated.push({ attendeeId: attendee.id, ticketNumber: result.ticket.ticketNumber, publicToken: result.publicToken, publicUrl: result.publicUrl });
    }
    await prisma.auditLog.create({ data: { userId: user.id, eventId, action: "TICKETS_GENERATED", entityType: "Ticket", newValue: { count: generated.length } } });
    return NextResponse.json({ generated });
  } catch (error) {
    return apiError(error);
  }
}
