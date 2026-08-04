import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser, requireEvent } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { attendeeSchema } from "@/lib/validation";
import { issueTicket } from "@/lib/tickets";

type Context = { params: Promise<{ eventId: string }> };
type InputRow = Record<string, unknown>;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_IMPORT_ROWS = 500;
const IMPORT_CONCURRENCY = 5;

function value(row: InputRow, ...keys: string[]): string {
  const entry = Object.entries(row).find(([key]) => keys.includes(key.trim().toLowerCase()));
  return entry?.[1] == null ? "" : String(entry[1]).trim();
}

export async function POST(request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const { eventId } = await params;
    await requireEvent(user, eventId, "attendees:write");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "กรุณาแนบไฟล์ CSV หรือ Excel" }, { status: 422 });
    if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 5 MB" }, { status: 413 });
    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<InputRow>(sheet, { defval: "" });
    if (rows.length > MAX_IMPORT_ROWS) return NextResponse.json({ error: `นำเข้าได้ไม่เกิน ${MAX_IMPORT_ROWS} รายการต่อครั้ง` }, { status: 422 });
    const errors: Array<{ row: number; message: string }> = [];
    const importedAttendeeIds: string[] = [];
    let imported = 0;
    for (let offset = 0; offset < rows.length; offset += IMPORT_CONCURRENCY) {
      const batch = rows.slice(offset, offset + IMPORT_CONCURRENCY);
      const results = await Promise.all(batch.map(async (row, batchIndex) => {
        const index = offset + batchIndex;
        const parsed = attendeeSchema.safeParse({ title: value(row, "title", "คำนำหน้า"), firstName: value(row, "firstname", "first_name", "ชื่อ"), lastName: value(row, "lastname", "last_name", "นามสกุล"), email: value(row, "email", "อีเมล"), phone: value(row, "phone", "เบอร์โทร"), company: value(row, "company", "บริษัท"), referenceCode: value(row, "referencecode", "reference_code", "เลขอ้างอิง"), ticketType: value(row, "tickettype", "ticket_type", "ประเภทบัตร") || "General", note: value(row, "note", "หมายเหตุ") });
        if (!parsed.success) return { row: index + 2, error: Object.values(parsed.error.flatten().fieldErrors).flat().join(", ") || "ข้อมูลไม่ครบ" };
        try {
          const attendeeId = await prisma.$transaction(async (tx) => {
            const attendee = await tx.attendee.create({ data: { eventId, title: parsed.data.title || null, firstName: parsed.data.firstName, lastName: parsed.data.lastName, email: parsed.data.email || null, phone: parsed.data.phone || null, company: parsed.data.company || null, referenceCode: parsed.data.referenceCode || null, note: parsed.data.note || null } });
            await issueTicket(tx, { eventId, attendeeId: attendee.id, ticketType: parsed.data.ticketType, updateAttendeeStatus: false });
            return attendee.id;
          });
          return { row: index + 2, attendeeId };
        } catch {
          return { row: index + 2, error: "ไม่สามารถบันทึกข้อมูลแถวนี้ได้ อาจมีเลขอ้างอิงซ้ำ" };
        }
      }));
      for (const result of results) {
        if (result.error) errors.push({ row: result.row, message: result.error });
        else {
          imported += 1;
          importedAttendeeIds.push(result.attendeeId);
        }
      }
    }
    if (importedAttendeeIds.length) {
      await prisma.attendee.updateMany({ where: { id: { in: importedAttendeeIds } }, data: { status: "QR_GENERATED" } });
    }
    await prisma.auditLog.create({ data: { userId: user.id, eventId, action: "ATTENDEES_IMPORTED", entityType: "Attendee", newValue: { imported, rejected: errors.length } } });
    return NextResponse.json({ imported, rejected: errors.length, errors });
  } catch (error) {
    return apiError(error);
  }
}
