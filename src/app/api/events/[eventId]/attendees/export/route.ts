import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser, requireEvent } from "@/lib/guards";
import { apiError } from "@/lib/http";

type Context = { params: Promise<{ eventId: string }> };

function safeCell(value: string | null | undefined): string {
  const normalized = value ?? "";
  return /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
}

export async function GET(_request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const { eventId } = await params;
    await requireEvent(user, eventId, "events:read");
    const attendees = await prisma.attendee.findMany({ where: { eventId }, orderBy: { lastName: "asc" }, include: { tickets: { orderBy: { createdAt: "desc" }, take: 1 } } });
    const rows = attendees.map((attendee) => ({ คำนำหน้า: safeCell(attendee.title), ชื่อ: safeCell(attendee.firstName), นามสกุล: safeCell(attendee.lastName), Email: safeCell(attendee.email), เบอร์โทร: safeCell(attendee.phone), บริษัท: safeCell(attendee.company), เลขอ้างอิง: safeCell(attendee.referenceCode), ประเภทบัตร: safeCell(attendee.tickets[0]?.ticketType), สถานะ: attendee.status }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Attendees");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="attendees-${eventId}.xlsx"` } });
  } catch (error) {
    return apiError(error);
  }
}
