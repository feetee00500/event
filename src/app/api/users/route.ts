import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { userSchema } from "@/lib/validation";
import { getUsers } from "@/lib/server-data";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "คุณไม่มีสิทธิ์ดูผู้ใช้งาน" }, { status: 403 });
    return NextResponse.json({ users: await getUsers(user) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuthenticatedUser();
    if (currentUser.role !== "SUPER_ADMIN") return NextResponse.json({ error: "คุณไม่มีสิทธิ์สร้างผู้ใช้งาน" }, { status: 403 });
    const data = userSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({ data: { name: data.name, email: data.email.toLowerCase(), passwordHash, role: data.role, isActive: data.isActive } });
    await prisma.auditLog.create({ data: { userId: currentUser.id, action: "USER_CREATED", entityType: "User", entityId: user.id, newValue: { role: user.role, email: user.email } } });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
