import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser, requireEvent } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { gateSchema } from "@/lib/validation";

type Context = { params: Promise<{ gateId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const { gateId } = await params;
    const existing = await prisma.gate.findUnique({ where: { id: gateId } });
    if (!existing) return NextResponse.json({ error: "ไม่พบ Gate" }, { status: 404 });
    await requireEvent(user, existing.eventId, "events:write");
    const data = gateSchema.parse(await request.json());
    const gate = await prisma.gate.update({ where: { id: gateId }, data: { name: data.name, description: data.description || null, location: data.location || null, isActive: data.isActive } });
    await prisma.auditLog.create({ data: { userId: user.id, eventId: existing.eventId, action: "GATE_UPDATED", entityType: "Gate", entityId: gateId, newValue: { name: gate.name, isActive: gate.isActive } } });
    return NextResponse.json({ gate });
  } catch (error) {
    return apiError(error);
  }
}
