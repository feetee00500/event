import { z } from "zod";

const dateTime = z.string().datetime({ offset: true, message: "กรุณาระบุวันเวลาให้ถูกต้อง" });

export const loginSchema = z.object({ email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"), password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร") });

export const eventSchema = z.object({
  name: z.string().trim().min(2, "กรุณาระบุชื่องาน").max(160, "ชื่องานยาวเกินไป"),
  description: z.string().trim().max(5000, "รายละเอียดงานยาวเกินไป").optional().or(z.literal("")),
  venue: z.string().trim().min(2, "กรุณาระบุสถานที่").max(240, "สถานที่ยาวเกินไป"),
  imageUrl: z.string().max(1_500_000, "รูปภาพใหญ่เกินไป").refine((value) => value === "" || value.startsWith("data:image/") || /^https?:\/\//i.test(value), "URL รูปภาพไม่ถูกต้อง").optional().or(z.literal("")),
  startAt: dateTime,
  endAt: dateTime,
  checkinOpenAt: dateTime,
  checkinCloseAt: dateTime,
  status: z.enum(["DRAFT", "PUBLISHED", "ACTIVE", "COMPLETED", "CANCELLED"]),
  accessMode: z.enum(["SINGLE_ENTRY", "REENTRY", "MULTI_DAY"]),
}).superRefine((value, ctx) => {
  const startAt = new Date(value.startAt); const endAt = new Date(value.endAt); const checkinOpenAt = new Date(value.checkinOpenAt); const checkinCloseAt = new Date(value.checkinCloseAt);
  if (endAt <= startAt) ctx.addIssue({ code: "custom", path: ["endAt"], message: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม" });
  // Opening before the event is valid and common; it must not be after the event ends.
  if (checkinOpenAt > endAt) ctx.addIssue({ code: "custom", path: ["checkinOpenAt"], message: "เวลาเปิด Check-in ต้องไม่เกินเวลาสิ้นสุดงาน" });
  if (checkinCloseAt < startAt || checkinCloseAt > endAt) ctx.addIssue({ code: "custom", path: ["checkinCloseAt"], message: "เวลาปิด Check-in ต้องอยู่ตั้งแต่เริ่มงานจนถึงก่อนจบงาน" });
  if (checkinCloseAt <= checkinOpenAt) ctx.addIssue({ code: "custom", path: ["checkinCloseAt"], message: "เวลาปิดต้องมากกว่าเวลาเปิด Check-in" });
});

export const attendeeSchema = z.object({ title: z.string().trim().max(40).optional().or(z.literal("")), firstName: z.string().trim().min(1, "กรุณาระบุชื่อ").max(120), lastName: z.string().trim().min(1, "กรุณาระบุนามสกุล").max(120), email: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")), phone: z.string().trim().max(40).optional().or(z.literal("")), company: z.string().trim().max(160).optional().or(z.literal("")), referenceCode: z.string().trim().max(100).optional().or(z.literal("")), ticketType: z.string().trim().min(1).max(80).default("General"), note: z.string().trim().max(1000).optional().or(z.literal("")) });
export const checkinSchema = z.object({ token: z.string().trim().min(8, "QR Code ไม่ถูกต้อง").max(512), eventId: z.string().cuid("Event ไม่ถูกต้อง"), gateId: z.string().cuid("Gate ไม่ถูกต้อง"), deviceId: z.string().trim().max(120).optional() });
export const manualCheckinSchema = z.object({ ticketNumber: z.string().trim().min(3).max(80), eventId: z.string().cuid(), gateId: z.string().cuid(), deviceId: z.string().trim().max(120).optional() });
export const gateSchema = z.object({ name: z.string().trim().min(1, "กรุณาระบุชื่อ Gate").max(120), description: z.string().trim().max(500).optional().or(z.literal("")), location: z.string().trim().max(240).optional().or(z.literal("")), isActive: z.boolean().default(true) });
export const userSchema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().email(), password: z.string().min(8).max(120), role: z.enum(["SUPER_ADMIN", "EVENT_ADMIN", "EVENT_STAFF", "VIEWER"]), isActive: z.boolean().default(true) });

export type EventInput = z.infer<typeof eventSchema>;
export type AttendeeInput = z.infer<typeof attendeeSchema>;
