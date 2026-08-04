import type { EventAssignmentRole, Prisma, UserRole } from "@prisma/client";

export type Permission =
  | "events:read"
  | "events:write"
  | "attendees:write"
  | "tickets:write"
  | "checkin:write"
  | "reports:read"
  | "users:write"
  | "audit:read";

const rolePermissions: Record<UserRole, readonly Permission[]> = {
  SUPER_ADMIN: ["events:read", "events:write", "attendees:write", "tickets:write", "checkin:write", "reports:read", "users:write", "audit:read"],
  EVENT_ADMIN: ["events:read", "events:write", "attendees:write", "tickets:write", "checkin:write", "reports:read"],
  EVENT_STAFF: ["events:read", "checkin:write"],
  VIEWER: ["events:read", "reports:read"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function canManageEvent(role: UserRole, assignment?: EventAssignmentRole | null): boolean {
  if (role === "SUPER_ADMIN") return true;
  return role === "EVENT_ADMIN" && assignment === "EVENT_ADMIN";
}

export function canCheckIn(role: UserRole, assignment?: EventAssignmentRole | null): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (role !== "EVENT_ADMIN" && role !== "EVENT_STAFF") return false;
  return assignment === "EVENT_ADMIN" || assignment === "EVENT_STAFF";
}

export function roleLabel(role: UserRole | EventAssignmentRole): string {
  return { SUPER_ADMIN: "ผู้ดูแลระบบสูงสุด", EVENT_ADMIN: "ผู้ดูแลงาน", EVENT_STAFF: "เจ้าหน้าที่หน้างาน", VIEWER: "ผู้ดูรายงาน" }[role];
}

export function eventScope(userId: string, role: UserRole): Prisma.EventWhereInput {
  return role === "SUPER_ADMIN" ? {} : { assignments: { some: { userId } } };
}
