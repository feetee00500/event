import { PageHeader } from "@/components/app-shell/page-header";
import { EventForm } from "@/components/event/event-form";
import { PRODUCT_NAME } from "@/lib/branding";

export default function NewEventPage() {
  return <><PageHeader eyebrow={`กิจกรรม ${PRODUCT_NAME}`} title="สร้างกิจกรรม" description="ตั้งชื่อ รายละเอียด วันเวลา สถานที่ และกติกา Check-in ให้ครบในขั้นตอนเดียว" /><EventForm /></>;
}