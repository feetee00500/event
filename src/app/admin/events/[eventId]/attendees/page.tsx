import { getCurrentUser } from "@/lib/auth";
import { canManageEvent } from "@/lib/permissions";
import { getAttendees, getEvent } from "@/lib/server-data";
import { PageHeader } from "@/components/app-shell/page-header";
import { EventTabs } from "@/components/event/event-tabs";
import { AttendeeManager, type AttendeeRow } from "@/components/attendee/attendee-manager";
import { InlineNotice } from "@/components/ui/feedback";

type Props = { params: Promise<{ eventId: string }> };

export const dynamic = "force-dynamic";

export default async function AttendeesPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { eventId } = await params;
  try {
    const event = await getEvent(user, eventId);
    const attendees = event ? await getAttendees(user, eventId, true) : null;
    if (!event || !attendees) return <InlineNotice tone="error">ไม่พบ Event</InlineNotice>;
    const rows: AttendeeRow[] = attendees.map((attendee) => ({
      id: attendee.id,
      title: attendee.title,
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      email: attendee.email,
      phone: attendee.phone,
      company: attendee.company,
      referenceCode: attendee.referenceCode,
      note: attendee.note,
      status: attendee.status,
      ticket: attendee.tickets[0] ? { id: attendee.tickets[0].id, ticketNumber: attendee.tickets[0].ticketNumber, ticketType: attendee.tickets[0].ticketType, status: attendee.tickets[0].status, checkedInAt: attendee.tickets[0].checkedInAt?.toISOString() ?? null } : null,
    }));
    return <><PageHeader eyebrow={event.name} title="ผู้เข้าร่วม" description="เพิ่ม แก้ไข ลบรายชื่อ ออก QR และติดตามสถานะบัตรของแต่ละคน" /><EventTabs eventId={eventId} active="/attendees" canManage={canManageEvent(user.role, event.assignments[0]?.role)} /><div className="mt-6"><AttendeeManager eventId={eventId} initialAttendees={rows} canWrite={canManageEvent(user.role, event.assignments[0]?.role)} /></div></>;
  } catch {
    return <InlineNotice tone="error">ไม่สามารถโหลดรายชื่อผู้เข้าร่วมได้</InlineNotice>;
  }
}
