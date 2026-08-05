import { getCurrentUser } from "@/lib/auth";
import { canManageEvent } from "@/lib/permissions";
import { getCheckinsPageData } from "@/lib/server-data";
import { PageHeader } from "@/components/app-shell/page-header";
import { EventTabs } from "@/components/event/event-tabs";
import { CheckinHistory, type CheckinRow } from "@/components/checkin/checkin-history";
import { DataLoadNotice } from "@/components/ui/feedback";

type Props = { params: Promise<{ eventId: string }> };
export const dynamic = "force-dynamic";

export default async function CheckinsPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { eventId } = await params;
  try {
    const { event, checkins } = await getCheckinsPageData(user, eventId);
    const rows: CheckinRow[] = checkins.map((item) => ({ id: item.id, result: item.result, scannedAt: item.scannedAt.toISOString(), gate: item.gate?.name ?? "—", staff: item.scannedBy?.name ?? "ระบบ", deviceId: item.deviceId, ticketNumber: item.ticket?.ticketNumber ?? "—", attendee: item.ticket ? `${item.ticket.attendee.firstName} ${item.ticket.attendee.lastName}` : "ไม่พบ Ticket", ticketType: item.ticket?.ticketType ?? "—" }));
    return <><PageHeader eyebrow={event.name} title="ประวัติ Check-in" description="ตรวจสอบผลการสแกนล่าสุด ค้นหาความผิดปกติ และกรองตาม Gate หรือ Staff" /><EventTabs eventId={eventId} active="/checkins" canManage={canManageEvent(user.role, event.assignments[0]?.role)} /><div className="mt-6"><CheckinHistory initialRows={rows} /></div></>;
  } catch (error) { console.error("[CheckinsPage] data load failed", error); return <><PageHeader eyebrow="Event" title="ประวัติ Check-in" description="ตรวจสอบผลการสแกนล่าสุด ค้นหาความผิดปกติ และกรองตาม Gate หรือ Staff" /><EventTabs eventId={eventId} active="/checkins" canManage={false} /><div className="mt-6"><DataLoadNotice resource="ประวัติ Check-in" /></div></>; }
}
