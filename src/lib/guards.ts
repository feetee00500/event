import { prisma } from "@/lib/db";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { eventScope, hasPermission, type Permission } from "@/lib/permissions";

export class ForbiddenError extends Error {
  constructor(message = "คุณไม่มีสิทธิ์ดำเนินการนี้") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "ไม่พบข้อมูลที่ต้องการ") {
    super(message);
    this.name = "NotFoundError";
  }
}

export async function requireEvent(user: CurrentUser, eventId: string, permission: Permission) {
  if (!hasPermission(user.role, permission)) throw new ForbiddenError();
  const event = await prisma.event.findFirst({ where: { id: eventId, ...eventScope(user.id, user.role) }, include: { assignments: { where: { userId: user.id }, select: { role: true } } } });
  if (!event) throw new NotFoundError("ไม่พบ Event หรือคุณไม่ได้รับมอบหมายงานนี้");
  return event;
}

export async function requireAuthenticatedUser(): Promise<CurrentUser> {
  return requireUser();
}
