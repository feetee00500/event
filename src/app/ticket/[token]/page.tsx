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
function calendarUrl(name: string, startAt: Date, endAt: Date, venue: string): string { const params = new URLSearchParams({ action: "TEMPLATE", text: `${PRODUCT_NAME} · ${name}`, dates: `${calendarDate(startAt)}/${calendarDate(endAt)}`, details: `${PRODUCT_NAME} · QR Code Check-in`, location: venue }); return `https://calendar.google.com/calendar/render?${params.toString()}`; }

export default async function PublicTicketPage({ params }: Props) {
  const { token } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { qrTokenHash: hashQrToken(token) }, include: { attendee: true, event: true } });

  if (!ticket) {
    return <main className="flex min-h-[100dvh] items-center justify-center bg-[#002756] px-4"><div className="w-full max-w-md rounded-2xl border border-white/15 bg-white p-8 text-center shadow-soft"><AlertTriangle className="mx-auto text-danger" size={34} /><h1 className="mt-4 text-xl font-bold">ไม่พบบัตรเข้างาน</h1><p className="mt-2 text-sm text-muted">ลิงก์อาจไม่ถูกต้อง หรือ QR Code นี้ถูกสร้างใหม่แล้ว</p></div></main>;
  }

  const invalid = ticket.status === "CANCELLED" || ticket.status === "EXPIRED";
  const now = Date.now(); const notOpen = ticket.status === "ACTIVE" && now < ticket.event.checkinOpenAt.getTime(); const closed = ticket.status === "ACTIVE" && now > ticket.event.checkinCloseAt.getTime();
  const statusLabel = invalid ? (ticket.status === "CANCELLED" ? "CANCELLED" : "EXPIRED") : ticket.status === "CHECKED_IN" ? "CHECKED IN" : notOpen ? "NOT OPEN YET" : closed ? "CHECK-IN CLOSED" : "READY TO CHECK IN";
  const calendar = calendarUrl(ticket.event.name, ticket.event.startAt, ticket.event.endAt, ticket.event.venue);
  const eventDate = `${formatBangkokDateTime(ticket.event.startAt)} – ${formatBangkokDateTime(ticket.event.endAt)}`;

  return <main className="relative min-h-[100dvh] overflow-hidden bg-[#002756] px-4 py-7 print:bg-white sm:py-12"><div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rotate-45 border-[42px] border-[#0da48e]/10 print:hidden" /><div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rotate-45 border-[54px] border-white/[0.035] print:hidden" /><div className="relative mx-auto max-w-[660px]"><div className="mb-5 flex items-center justify-between text-white print:hidden"><Link href="/" className="focus-ring flex items-center gap-2 rounded-sm text-sm font-black tracking-[-0.02em]"><span className="h-3 w-3 rotate-45 rounded-[2px] bg-[#0da48e]" />{PRODUCT_NAME}</Link><span className="flex items-center gap-1.5 text-xs text-[#baf3df]"><ShieldCheck size={15} />Official digital pass</span></div><IirfaTicketPass token={token} attendeeName={`${ticket.attendee.firstName} ${ticket.attendee.lastName}`} ticketNumber={ticket.ticketNumber} ticketType={ticket.ticketType} eventName={ticket.event.name} eventDate={eventDate} venue={ticket.event.venue} statusLabel={statusLabel} invalid={invalid} showDownload />{invalid ? <div className="mt-4 rounded-lg border border-[#ffb4aa]/40 bg-[#6f1d17] px-4 py-3 text-sm text-white print:hidden">บัตรนี้ไม่สามารถใช้เข้าร่วมงานได้ กรุณาติดต่อผู้จัดงาน</div> : null}<section id="instructions" className="mt-5 rounded-xl border border-white/15 bg-white/10 p-5 text-white print:hidden"><p className="eyebrow text-[#7bdcb5]">Before you arrive</p><h2 className="mt-2 text-lg font-semibold">เตรียมบัตรก่อนถึงจุด Check-in</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-white/75"><li>เปิดบัตรนี้ล่วงหน้าและเพิ่มความสว่างหน้าจอ</li><li>แสดง QR Code ให้เจ้าหน้าที่สแกนที่ Gate ที่กำหนด</li><li>บัตร 1 ใบใช้ได้ตามกติกาและช่วงเวลาของกิจกรรม</li></ul><div className="mt-5 flex flex-wrap gap-2"><a href={calendar} target="_blank" rel="noreferrer" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-sm bg-[#0da48e] px-3 text-sm font-semibold text-[#002756] hover:bg-[#22c7ae]"><CalendarPlus size={16} />เพิ่มลงปฏิทิน</a><PrintButton label="พิมพ์บัตร" /></div></section><p className="mt-5 text-center text-xs text-[#a9bfd3] print:hidden">บัตรนี้ออกให้เฉพาะผู้มีชื่อบนบัตร กรุณาอย่าแชร์ลิงก์กับผู้อื่น</p></div></main>;
}