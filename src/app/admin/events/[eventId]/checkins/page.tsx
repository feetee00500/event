import { getCurrentUser } from "@/lib/auth";
import { canManageEvent } from "@/lib/permissions";
import { getCheckins, getEvent } from "@/lib/server-data";
import { PageHeader } from "@/components/app-shell/page-header";
import { EventTabs } from "@/components/event/event-tabs";
import { CheckinHistory, type CheckinRow } from "@/components/checkin/checkin-history";
import { InlineNotice } from "@/components/ui/feedback";

type Props = { params: Promise<{ eventId: string }> };
export const dynamic = "force-dynamic";

export default async function CheckinsPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { eventId } = await params;
  try {
    const [event, checkins] = await Promise.all([
      getEvent(user, eventId),
      getCheckins(user, eventId, true),
    ]);
    if (!event || !checkins) return <InlineNotice tone="error">ไม่พบ Event</InlineNotice>;
    const rows: CheckinRow[] = checkins.map((item) => ({ id: item.id, result: item.result, scannedAt: item.scannedAt.toISOString(), gate: item.gate?.name ?? "—", staff: item.scannedBy?.name ?? "ระบบ", deviceId: item.deviceId, ticketNumber: item.ticket?.ticketNumber ?? "—", attendee: item.ticket ? `${item.ticket.attendee.firstName} ${item.ticket.attendee.lastName}` : "ไม่พบ Ticket", ticketType: item.ticket?.ticketType ?? "—" }));
    return <><PageHeader eyebrow={event.name} title="ประวัติ Check-in" description="ตรวจสอบผลการสแกนล่าสุด ค้นหาความผิดปกติ และกรองตาม Gate หรือ Staff" /><EventTabs eventId={eventId} active="/checkins" canManage={canManageEvent(user.role, event.assignments[0]?.role)} /><div className="mt-6"><CheckinHistory initialRows={rows} /></div></>;
  } catch {
    return <InlineNotice tone="error">ไม่สามารถโหลดประวัติ Check-in ได้</InlineNotice>;
  }
}
