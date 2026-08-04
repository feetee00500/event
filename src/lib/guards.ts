import { prisma } from "@/lib/db";
import { AuthRequiredError, auth, isDevelopmentAuthBypassEnabled, requireUser, type CurrentUser } from "@/lib/auth";
import { canCheckIn, canManageEvent, eventScope, hasPermission, type Permission } from "@/lib/permissions";

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
  const assignment = event.assignments[0]?.role;
  if (["events:write", "attendees:write", "tickets:write"].includes(permission) && !canManageEvent(user.role, assignment)) throw new ForbiddenError();
  if (permission === "checkin:write" && !canCheckIn(user.role, assignment)) throw new ForbiddenError();
  return event;
}

export async function requireAuthenticatedUser(): Promise<CurrentUser> {
  return requireUser();
}

export async function requireCheckinUser(): Promise<CurrentUser> {
  if (isDevelopmentAuthBypassEnabled()) return requireUser();
  const session = await auth();
  if (!session?.user?.id) throw new AuthRequiredError();
  return { id: session.user.id, name: session.user.name ?? "", email: session.user.email ?? "", role: session.user.role, isActive: true };
}
