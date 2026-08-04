import { getCurrentUser } from "@/lib/auth";
import { canManageEvent } from "@/lib/permissions";
import { getEvent, getTickets, MAX_LIST_ROWS } from "@/lib/server-data";
import { PageHeader } from "@/components/app-shell/page-header";
import { EventTabs } from "@/components/event/event-tabs";
import { TicketManager, type TicketRow } from "@/components/ticket/ticket-manager";
import { DataLoadNotice, InlineNotice } from "@/components/ui/feedback";
import { PRODUCT_NAME } from "@/lib/branding";

type Props = { params: Promise<{ eventId: string }> };
export const dynamic = "force-dynamic";

export default async function TicketsPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { eventId } = await params;
  try {
    const [event, result] = await Promise.all([
      getEvent(user, eventId),
      getTickets(user, eventId),
    ]);
    const tickets = result.rows;
    if (!event) return <><PageHeader eyebrow="Event" title="บัตรและ QR Code" description="ออกบัตรดิจิทัลและจัดการ QR สำหรับ Check-in" /><EventTabs eventId={eventId} active="/tickets" canManage={false} /><div className="mt-6"><InlineNotice tone="error">ไม่พบ Event</InlineNotice></div></>;
    const rows: TicketRow[] = tickets.map((ticket) => ({ id: ticket.id, ticketNumber: ticket.ticketNumber, ticketType: ticket.ticketType, status: ticket.status, issuedAt: ticket.issuedAt.toISOString(), expiresAt: ticket.expiresAt?.toISOString() ?? null, checkedInAt: ticket.checkedInAt?.toISOString() ?? null, attendeeStatus: ticket.attendee.status, attendee: { name: `${ticket.attendee.firstName} ${ticket.attendee.lastName}`, email: ticket.attendee.email } }));
    return <><PageHeader eyebrow={event.name} title="บัตรและ QR Code" description={`ออกบัตรดิจิทัลในรูปแบบ ${PRODUCT_NAME} พร้อม QR สำหรับ Check-in`} /><EventTabs eventId={eventId} active="/tickets" canManage={canManageEvent(user.role, event.assignments[0]?.role)} />{result.truncated ? <div className="mt-6"><InlineNotice tone="info">แสดงเฉพาะ {MAX_LIST_ROWS} บัตรล่าสุด — Export เพื่อดูบัตรทั้งหมด</InlineNotice></div> : null}<div className="mt-6"><TicketManager event={{ name: event.name, startAt: event.startAt.toISOString(), endAt: event.endAt.toISOString(), venue: event.venue }} initialTickets={rows} canWrite={canManageEvent(user.role, event.assignments[0]?.role)} /></div></>;
  } catch (error) { console.error("[TicketsPage] data load failed", error); return <><PageHeader eyebrow="Event" title="บัตรและ QR Code" description="ออกบัตรดิจิทัลและจัดการ QR สำหรับ Check-in" /><EventTabs eventId={eventId} active="/tickets" canManage={false} /><div className="mt-6"><DataLoadNotice resource="บัตร" /></div></>; }
}