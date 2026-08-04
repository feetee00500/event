import Link from "next/link";
import { AlertTriangle, CalendarPlus, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { hashQrToken } from "@/lib/qr";
import { formatBangkokDateTime } from "@/lib/timezone";
import { IirfaTicketPass } from "@/components/ticket/iirfa-ticket-pass";
import { PrintButton } from "@/components/report/print-button";
import { PRODUCT_NAME } from "@/lib/branding";

type Props = { params: Promise<{ token: string }> };
export const dynamic = "force-dynamic";

function calendarDate(value: Date): string { return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
function calendarUrl(name: string, startAt: Date, endAt: Date, venue: string): string { const params = new URLSearchParams({ action: "TEMPLATE", text: PRODUCT_NAME + " · " + name, dates: calendarDate(startAt) + "/" + calendarDate(endAt), details: PRODUCT_NAME + " · QR Code Check-in", location: venue }); return "https://calendar.google.com/calendar/render?" + params.toString(); }

export default async function PublicTicketPage({ params }: Props) {
  const { token } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { qrTokenHash: hashQrToken(token) }, include: { attendee: true, event: true } });

  if (!ticket) {
    return <main className="flex min-h-[100dvh] items-center justify-center bg-canvas px-4"><div className="w-full max-w-md rounded-md border border-line bg-white p-8 text-center shadow-soft"><AlertTriangle className="mx-auto text-danger" size={34} /><h1 className="mt-4 text-xl font-semibold tracking-[-0.03em]">ไม่พบบัตรเข้างาน</h1><p className="mt-2 text-sm leading-6 text-muted">ลิงก์อาจไม่ถูกต้อง หรือ QR Code นี้ถูกสร้างใหม่แล้ว</p></div></main>;
  }

  const invalid = ticket.status === "CANCELLED" || ticket.status === "EXPIRED";
  const now = Date.now(); const notOpen = ticket.status === "ACTIVE" && now < ticket.event.checkinOpenAt.getTime(); const closed = ticket.status === "ACTIVE" && now > ticket.event.checkinCloseAt.getTime();
  const statusLabel = invalid ? (ticket.status === "CANCELLED" ? "CANCELLED" : "EXPIRED") : ticket.status === "CHECKED_IN" ? "CHECKED IN" : notOpen ? "NOT OPEN YET" : closed ? "CHECK-IN CLOSED" : "READY TO CHECK IN";
  const calendar = calendarUrl(ticket.event.name, ticket.event.startAt, ticket.event.endAt, ticket.event.venue);
  const eventDate = formatBangkokDateTime(ticket.event.startAt) + " – " + formatBangkokDateTime(ticket.event.endAt);

  return <main className="min-h-[100dvh] bg-canvas px-4 py-7 print:bg-white sm:py-12"><div className="mx-auto max-w-[660px]"><div className="mb-5 flex items-center justify-between gap-4 text-ink print:hidden"><Link href="/" className="focus-ring flex items-center gap-2 rounded-sm text-sm font-medium tracking-[-0.02em]"><span className="h-3 w-3 rotate-45 rounded-[2px] bg-[#0070f3]" />{PRODUCT_NAME}</Link><span className="flex items-center gap-1.5 text-xs text-link"><ShieldCheck size={15} />Official digital pass</span></div><IirfaTicketPass token={token} attendeeName={ticket.attendee.firstName + " " + ticket.attendee.lastName} ticketNumber={ticket.ticketNumber} ticketType={ticket.ticketType} eventName={ticket.event.name} eventDate={eventDate} venue={ticket.event.venue} statusLabel={statusLabel} invalid={invalid} showDownload />{invalid ? <div className="mt-4 rounded-sm border border-[#f4b7bb] bg-[#fff4f4] px-4 py-3 text-sm text-[#c50000] print:hidden">บัตรนี้ไม่สามารถใช้เข้าร่วมงานได้ กรุณาติดต่อผู้จัดงาน</div> : null}<section id="instructions" className="mt-5 rounded-md border border-line bg-white p-5 text-ink shadow-card print:hidden"><p className="eyebrow">Before you arrive</p><h2 className="mt-3 text-lg font-semibold tracking-[-0.03em]">เตรียมบัตรก่อนถึงจุด Check-in</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-muted"><li>เปิดบัตรนี้ล่วงหน้าและเพิ่มความสว่างหน้าจอ</li><li>แสดง QR Code ให้เจ้าหน้าที่สแกนที่ Gate ที่กำหนด</li><li>บัตร 1 ใบใช้ได้ตามกติกาและช่วงเวลาของกิจกรรม</li></ul><div className="mt-5 flex flex-wrap gap-2"><a href={calendar} target="_blank" rel="noreferrer" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-sm bg-ink px-3 text-sm font-medium text-white hover:bg-black"><CalendarPlus size={16} />เพิ่มลงปฏิทิน</a><PrintButton label="พิมพ์บัตร" /></div></section><p className="mt-5 text-center text-xs text-muted print:hidden">บัตรนี้ออกให้เฉพาะผู้มีชื่อบนบัตร กรุณาอย่าแชร์ลิงก์กับผู้อื่น</p></div></main>;
}
