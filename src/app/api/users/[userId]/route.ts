import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { z } from "zod";

type Context = { params: Promise<{ userId: string }> };
const updateSchema = z.object({ role: z.enum(["SUPER_ADMIN", "EVENT_ADMIN", "EVENT_STAFF", "VIEWER"]).optional(), isActive: z.boolean().optional() });

export async function PATCH(request: Request, { params }: Context) {
  try {
    const currentUser = await requireAuthenticatedUser();
    if (currentUser.role !== "SUPER_ADMIN") return NextResponse.json({ error: "คุณไม่มีสิทธิ์แก้ไขผู้ใช้งาน" }, { status: 403 });
    const { userId } = await params;
    if (userId === currentUser.id && (await request.clone().json().catch(() => ({})) as { isActive?: boolean }).isActive === false) return NextResponse.json({ error: "ไม่สามารถปิดใช้งานบัญชีของตนเอง" }, { status: 422 });
    const data = updateSchema.parse(await request.json());
    const user = await prisma.user.update({ where: { id: userId }, data });
    await prisma.auditLog.create({ data: { userId: currentUser.id, action: "USER_UPDATED", entityType: "User", entityId: userId, newValue: { role: user.role, isActive: user.isActive } } });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
  } catch (error) {
    return apiError(error);
  }
}
