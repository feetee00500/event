import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser, requireEvent } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { attendeeSchema } from "@/lib/validation";
import { issueTicket } from "@/lib/tickets";

type Context = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const { eventId } = await params;
    await requireEvent(user, eventId, "events:read");
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim();
    const status = url.searchParams.get("status");
    const attendees = await prisma.attendee.findMany({ where: { eventId, ...(status ? { status: status as never } : {}), ...(search ? { OR: [{ firstName: { contains: search, mode: "insensitive" } }, { lastName: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }, { referenceCode: { contains: search, mode: "insensitive" } }] } : {}) }, orderBy: { createdAt: "desc" }, take: 200, include: { tickets: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, ticketNumber: true, ticketType: true, status: true, checkedInAt: true } } } });
    return NextResponse.json({ attendees });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const { eventId } = await params;
    await requireEvent(user, eventId, "attendees:write");
    const data = attendeeSchema.parse(await request.json());
    const result = await prisma.$transaction(async (tx) => {
      const attendee = await tx.attendee.create({ data: { eventId, title: data.title || null, firstName: data.firstName, lastName: data.lastName, email: data.email || null, phone: data.phone || null, company: data.company || null, referenceCode: data.referenceCode || null, note: data.note || null } });
      const ticket = await issueTicket(tx, { eventId, attendeeId: attendee.id, ticketType: data.ticketType });
      await tx.auditLog.create({ data: { userId: user.id, eventId, action: "ATTENDEE_CREATED", entityType: "Attendee", entityId: attendee.id, newValue: { ticketType: data.ticketType } } });
      return { attendee, ticket };
    });
    return NextResponse.json({ attendee: result.attendee, ticket: { id: result.ticket.ticket.id, ticketNumber: result.ticket.ticket.ticketNumber, publicToken: result.ticket.publicToken, publicUrl: result.ticket.publicUrl } }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
