import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser, requireEvent } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { z } from "zod";

type Context = { params: Promise<{ eventId: string }> };
const schema = z.object({ ticketIds: z.array(z.string().cuid()).min(1).max(100) });

export async function POST(request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser(); const { eventId } = await params; await requireEvent(user, eventId, "tickets:write"); const data = schema.parse(await request.json());
    const result = await prisma.$transaction(async (tx) => { const updated = await tx.ticket.updateMany({ where: { eventId, id: { in: data.ticketIds } }, data: { status: "CANCELLED", cancelledAt: new Date() } }); await tx.attendee.updateMany({ where: { eventId, tickets: { some: { id: { in: data.ticketIds } } } }, data: { status: "CANCELLED" } }); await tx.auditLog.create({ data: { userId: user.id, eventId, action: "TICKETS_BULK_CANCELLED", entityType: "Ticket", newValue: { count: updated.count } } }); return updated.count; });
    return NextResponse.json({ cancelled: result });
  } catch (error) { return apiError(error); }
}
