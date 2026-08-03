import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser, requireEvent } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { attendeeSchema } from "@/lib/validation";

type Context = { params: Promise<{ eventId: string; attendeeId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser(); const { eventId, attendeeId } = await params; await requireEvent(user, eventId, "attendees:write");
    const data = attendeeSchema.parse(await request.json());
    const attendee = await prisma.attendee.update({ where: { id: attendeeId, eventId }, data: { title: data.title || null, firstName: data.firstName, lastName: data.lastName, email: data.email || null, phone: data.phone || null, company: data.company || null, referenceCode: data.referenceCode || null, note: data.note || null } });
    await prisma.auditLog.create({ data: { userId: user.id, eventId, action: "ATTENDEE_UPDATED", entityType: "Attendee", entityId: attendeeId } });
    return NextResponse.json({ attendee });
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser(); const { eventId, attendeeId } = await params; await requireEvent(user, eventId, "attendees:write");
    await prisma.$transaction(async (tx) => { await tx.attendee.update({ where: { id: attendeeId, eventId }, data: { status: "CANCELLED" } }); await tx.ticket.updateMany({ where: { attendeeId, eventId, status: { in: ["ACTIVE", "CHECKED_IN"] } }, data: { status: "CANCELLED", cancelledAt: new Date() } }); await tx.auditLog.create({ data: { userId: user.id, eventId, action: "ATTENDEE_CANCELLED", entityType: "Attendee", entityId: attendeeId } }); });
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error); }
}
