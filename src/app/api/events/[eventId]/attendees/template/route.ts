import { NextResponse } from "next/server";
import { requireAuthenticatedUser, requireEvent } from "@/lib/guards";
import { apiError } from "@/lib/http";

type Context = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser(); const { eventId } = await params; await requireEvent(user, eventId, "events:read");
    const csv = "คำนำหน้า,ชื่อ,นามสกุล,Email,เบอร์โทร,บริษัท,เลขอ้างอิง,ประเภทบัตร,หมายเหตุ\nคุณ,สมชาย,ใจดี,somchai@example.com,0812345678,TIRD,REG-0001,General,ตัวอย่าง";
    return new NextResponse(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="attendee-template-${eventId}.csv"` } });
  } catch (error) { return apiError(error); }
}
