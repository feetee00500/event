import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser, requireEvent } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { eventSchema } from "@/lib/validation";

type Context = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const { eventId } = await params;
    const event = await requireEvent(user, eventId, "events:read");
    return NextResponse.json({ event });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const { eventId } = await params;
    await requireEvent(user, eventId, "events:write");
    const data = eventSchema.parse(await request.json());
    const event = await prisma.event.update({ where: { id: eventId }, data: { name: data.name, description: data.description || null, venue: data.venue, imageUrl: data.imageUrl || null, startAt: new Date(data.startAt), endAt: new Date(data.endAt), checkinOpenAt: new Date(data.checkinOpenAt), checkinCloseAt: new Date(data.checkinCloseAt), status: data.status, accessMode: data.accessMode } });
    await prisma.auditLog.create({ data: { userId: user.id, eventId, action: "EVENT_UPDATED", entityType: "Event", entityId: eventId, newValue: { name: event.name, status: event.status } } });
    return NextResponse.json({ event });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const { eventId } = await params;
    await requireEvent(user, eventId, "events:write");
    const event = await prisma.event.update({ where: { id: eventId }, data: { status: "CANCELLED" } });
    await prisma.auditLog.create({ data: { userId: user.id, eventId, action: "EVENT_CANCELLED", entityType: "Event", entityId: eventId } });
    return NextResponse.json({ event });
  } catch (error) {
    return apiError(error);
  }
}
