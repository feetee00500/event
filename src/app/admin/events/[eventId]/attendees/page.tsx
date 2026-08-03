import { getCurrentUser } from "@/lib/auth";
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
    const [event, attendees] = await Promise.all([getEvent(user, eventId), getAttendees(user, eventId)]);
    if (!event || !attendees) return <InlineNotice tone="error">ไม่พบ Event</InlineNotice>;
    const rows: AttendeeRow[] = attendees.map((attendee) => ({ id: attendee.id, title: attendee.title, firstName: attendee.firstName, lastName: attendee.lastName, email: attendee.email, phone: attendee.phone, company: attendee.company, referenceCode: attendee.referenceCode, status: attendee.status, ticket: attendee.tickets[0] ? { id: attendee.tickets[0].id, ticketNumber: attendee.tickets[0].ticketNumber, ticketType: attendee.tickets[0].ticketType, status: attendee.tickets[0].status, checkedInAt: attendee.tickets[0].checkedInAt?.toISOString() ?? null } : null }));
    return <><PageHeader eyebrow={event.name} title="ผู้เข้าร่วม" description="เพิ่มรายชื่อ ออก QR และติดตามสถานะบัตรของแต่ละคน" /><EventTabs eventId={eventId} active="/attendees" /><div className="mt-6"><AttendeeManager eventId={eventId} initialAttendees={rows} canWrite={user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN"} /></div></>;
  } catch {
    return <InlineNotice tone="error">ไม่สามารถโหลดรายชื่อผู้เข้าร่วมได้</InlineNotice>;
  }
}
