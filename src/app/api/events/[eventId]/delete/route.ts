import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ForbiddenError, NotFoundError, requireAuthenticatedUser } from "@/lib/guards";
import { apiError } from "@/lib/http";

type Context = { params: Promise<{ eventId: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    if (user.role !== "SUPER_ADMIN") throw new ForbiddenError();
    const { eventId } = await params;
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, name: true, status: true } });
    if (!event) throw new NotFoundError("ไม่พบ Event");
    await prisma.$transaction([
      prisma.auditLog.updateMany({ where: { eventId }, data: { eventId: null } }),
      prisma.auditLog.create({ data: { userId: user.id, eventId: null, action: "EVENT_DELETED", entityType: "Event", entityId: eventId, newValue: { name: event.name, status: event.status } } }),
      prisma.event.delete({ where: { id: eventId } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
