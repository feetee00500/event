import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuthenticatedUser, requireEvent } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { gateSchema } from "@/lib/validation";
import { createDeviceCode } from "@/lib/qr";

type Context = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const db = getDb();
    const { eventId } = await params;
    await requireEvent(user, eventId, "events:read");
    const gates = await db.gate.findMany({ where: { eventId }, orderBy: { name: "asc" }, include: { _count: { select: { checkins: { where: { result: "SUCCESS" } } } } } });
    return NextResponse.json({ gates });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const db = getDb();
    const { eventId } = await params;
    await requireEvent(user, eventId, "events:write");
    const data = gateSchema.parse(await request.json());
    const gate = await db.gate.create({ data: { eventId, name: data.name, description: data.description || null, location: data.location || null, isActive: data.isActive, deviceCode: createDeviceCode() } });
    await db.auditLog.create({ data: { userId: user.id, eventId, action: "GATE_CREATED", entityType: "Gate", entityId: gate.id, newValue: { name: gate.name } } });
    return NextResponse.json({ gate }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
