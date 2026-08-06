import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ForbiddenError, NotFoundError, requireAuthenticatedUser } from "@/lib/guards";
import { apiError } from "@/lib/http";

type Context = { params: Promise<{ eventId: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const db = getDb();
    if (user.role !== "SUPER_ADMIN") throw new ForbiddenError();
    const { eventId } = await params;
    const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true, name: true, status: true } });
    if (!event) throw new NotFoundError("ไม่พบ Event");
    await db.$transaction([
      db.auditLog.updateMany({ where: { eventId }, data: { eventId: null } }),
      db.auditLog.create({ data: { userId: user.id, eventId: null, action: "EVENT_DELETED", entityType: "Event", entityId: eventId, newValue: { name: event.name, status: event.status } } }),
      db.event.delete({ where: { id: eventId } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
