import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { eventSchema } from "@/lib/validation";
import { hasPermission } from "@/lib/permissions";
import { getEvents } from "@/lib/server-data";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    return NextResponse.json({ events: await getEvents(user) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    if (!hasPermission(user.role, "events:write")) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ตั้งค่าข้อมูลโครงการ" }, { status: 403 });
    }

    const existingProject = await prisma.event.findFirst({ select: { id: true } });
    if (existingProject) {
      return NextResponse.json(
        { error: "ระบบนี้รองรับ IIRFA 2026 เพียงโครงการเดียว กรุณาแก้ไขระเบียนเดิม" },
        { status: 409 },
      );
    }

    const data = eventSchema.parse(await request.json());
    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          name: data.name,
          description: data.description || null,
          venue: data.venue,
          imageUrl: data.imageUrl || null,
          startAt: new Date(data.startAt),
          endAt: new Date(data.endAt),
          checkinOpenAt: new Date(data.checkinOpenAt),
          checkinCloseAt: new Date(data.checkinCloseAt),
          status: data.status,
          accessMode: data.accessMode,
          createdById: user.id,
        },
      });
      await tx.eventAssignment.create({ data: { eventId: created.id, userId: user.id, role: "EVENT_ADMIN" } });
      await tx.gate.create({ data: { eventId: created.id, name: "Main Gate", location: "จุดลงทะเบียนหลัก" } });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          eventId: created.id,
          action: "EVENT_CREATED",
          entityType: "Event",
          entityId: created.id,
          newValue: { name: created.name, status: created.status },
        },
      });
      return created;
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}