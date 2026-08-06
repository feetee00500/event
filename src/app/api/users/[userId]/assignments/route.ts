import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { z } from "zod";

type Context = { params: Promise<{ userId: string }> };
const schema = z.object({ eventId: z.string().cuid(), role: z.enum(["EVENT_ADMIN", "EVENT_STAFF", "VIEWER"]) });

export async function POST(request: Request, { params }: Context) {
  try {
    const currentUser = await requireAuthenticatedUser();
    const db = getDb(); if (currentUser.role !== "SUPER_ADMIN") return NextResponse.json({ error: "คุณไม่มีสิทธิ์มอบหมาย Event" }, { status: 403 }); const { userId } = await params; const data = schema.parse(await request.json());
    const assignment = await db.eventAssignment.upsert({ where: { eventId_userId: { eventId: data.eventId, userId } }, update: { role: data.role }, create: { eventId: data.eventId, userId, role: data.role } });
    await db.auditLog.create({ data: { userId: currentUser.id, eventId: data.eventId, action: "USER_EVENT_ASSIGNED", entityType: "EventAssignment", entityId: assignment.id, newValue: { userId, role: data.role } } });
    return NextResponse.json({ assignment });
  } catch (error) { return apiError(error); }
}
