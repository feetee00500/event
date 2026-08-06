import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuthenticatedUser, requireEvent } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { issueTicket } from "@/lib/tickets";

type Context = { params: Promise<{ eventId: string }> };
const MAX_TICKETS_PER_REQUEST = 300;
const GENERATE_CONCURRENCY = 5;

export async function POST(request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const db = getDb();
    const { eventId } = await params;
    await requireEvent(user, eventId, "tickets:write");
    const body = (await request.json().catch(() => ({}))) as { attendeeIds?: unknown };
    const attendeeIds = Array.isArray(body.attendeeIds) ? body.attendeeIds.filter((value): value is string => typeof value === "string") : [];
    if (attendeeIds.length > MAX_TICKETS_PER_REQUEST) return NextResponse.json({ error: `สร้างบัตรได้ไม่เกิน ${MAX_TICKETS_PER_REQUEST} ใบต่อครั้ง` }, { status: 422 });
    const attendees = await db.attendee.findMany({ where: { eventId, ...(attendeeIds.length ? { id: { in: attendeeIds } } : {}) }, take: MAX_TICKETS_PER_REQUEST, include: { tickets: { orderBy: { createdAt: "desc" }, take: 1 } } });
    const generated: Array<{ attendeeId: string; ticketNumber: string; publicToken: string; publicUrl: string }> = [];
    for (let offset = 0; offset < attendees.length; offset += GENERATE_CONCURRENCY) {
      const batch = attendees.slice(offset, offset + GENERATE_CONCURRENCY);
      const results = await Promise.all(batch.map(async (attendee) => {
        const result = await db.$transaction(async (tx) => {
          const oldTicket = attendee.tickets[0];
          if (oldTicket) await tx.ticket.update({ where: { id: oldTicket.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
          return issueTicket(tx, { eventId, attendeeId: attendee.id, ticketType: oldTicket?.ticketType ?? "General" });
        });
        return { attendeeId: attendee.id, ticketNumber: result.ticket.ticketNumber, publicToken: result.publicToken, publicUrl: result.publicUrl };
      }));
      generated.push(...results);
    }
    await db.auditLog.create({ data: { userId: user.id, eventId, action: "TICKETS_GENERATED", entityType: "Ticket", newValue: { count: generated.length } } });
    return NextResponse.json({ generated });
  } catch (error) {
    return apiError(error);
  }
}
