import type { Prisma } from "@prisma/client";
import { getDb } from "@/lib/db";

export async function writeAuditLog(input: {
  userId?: string;
  eventId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  ipAddress?: string;
}): Promise<void> {
  const db = getDb();
  await db.auditLog.create({ data: input });
}
