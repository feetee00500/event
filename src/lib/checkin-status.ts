export const checkinStatusLabels = {
  SUCCESS: "สำเร็จ",
  ALREADY_CHECKED_IN: "สแกนซ้ำ",
  INVALID_TOKEN: "QR ไม่ถูกต้อง",
  CANCELLED: "ยกเลิก",
  EXPIRED: "หมดอายุ",
  TOO_EARLY: "ยังไม่เปิด",
  TOO_LATE: "ปิดแล้ว",
  EVENT_MISMATCH: "ผิด Event",
  MANUAL_CHECKIN: "กรอกเอง",
} as const;

export type CheckinStatus = keyof typeof checkinStatusLabels;

export function checkinStatusLabel(status: CheckinStatus): string {
  return checkinStatusLabels[status];
}
