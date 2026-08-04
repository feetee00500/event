import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell/page-header";
import { EventForm } from "@/components/event/event-form";
import { getSessionUser } from "@/lib/auth";
import { canManageEvent } from "@/lib/permissions";
import { getEvent } from "@/lib/server-data";
import { PRODUCT_NAME } from "@/lib/branding";

type Props = { params: Promise<{ eventId: string }> };

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) return null;
  const { eventId } = await params;
  const event = await getEvent(user, eventId);
  if (!event || !canManageEvent(user.role, event.assignments[0]?.role)) notFound();
  return <><PageHeader eyebrow={`กิจกรรม ${PRODUCT_NAME}`} title="แก้ไขกิจกรรม" description="ปรับข้อมูลกิจกรรมและกติกา Check-in โดยไม่เปลี่ยนสิทธิ์หรือข้อมูลผู้เข้าร่วม" /><EventForm event={{ id: event.id, name: event.name, description: event.description ?? "", venue: event.venue, imageUrl: event.imageUrl ?? "", startAt: event.startAt.toISOString(), endAt: event.endAt.toISOString(), checkinOpenAt: event.checkinOpenAt.toISOString(), checkinCloseAt: event.checkinCloseAt.toISOString(), status: event.status, accessMode: event.accessMode }} /></>;
}
