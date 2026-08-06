import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { z } from "zod";

type Context = { params: Promise<{ userId: string }> };
const updateSchema = z.object({ role: z.enum(["SUPER_ADMIN", "EVENT_ADMIN", "EVENT_STAFF", "VIEWER"]).optional(), isActive: z.boolean().optional() });

export async function PATCH(request: Request, { params }: Context) {
  try {
    const currentUser = await requireAuthenticatedUser();
    const db = getDb();
    if (currentUser.role !== "SUPER_ADMIN") return NextResponse.json({ error: "คุณไม่มีสิทธิ์แก้ไขผู้ใช้งาน" }, { status: 403 });
    const { userId } = await params;
    if (userId === currentUser.id && (await request.clone().json().catch(() => ({})) as { isActive?: boolean }).isActive === false) return NextResponse.json({ error: "ไม่สามารถปิดใช้งานบัญชีของตนเอง" }, { status: 422 });
    const data = updateSchema.parse(await request.json());
    const user = await db.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: userId }, data });
      if (data.role === "SUPER_ADMIN") {
        await tx.eventAssignment.deleteMany({ where: { userId } });
      } else if (data.role) {
        const assignments = await tx.eventAssignment.updateMany({ where: { userId }, data: { role: data.role } });
        if (assignments.count === 0) {
          const event = await tx.event.findFirst({ select: { id: true } });
          if (event) await tx.eventAssignment.create({ data: { eventId: event.id, userId, role: data.role } });
        }
      }
      await tx.auditLog.create({ data: { userId: currentUser.id, action: "USER_UPDATED", entityType: "User", entityId: userId, newValue: { role: updated.role, isActive: updated.isActive } } });
      return updated;
    });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
  } catch (error) {
    return apiError(error);
  }
}
