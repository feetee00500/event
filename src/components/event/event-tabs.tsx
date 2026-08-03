import Link from "next/link";

const tabs = [["ภาพรวม", ""], ["ผู้เข้าร่วม", "/attendees"], ["บัตรและ QR", "/tickets"], ["จุดเข้างาน", "/gates"], ["ประวัติ Check-in", "/checkins"], ["รายงาน", "/reports"], ["ตั้งค่ากิจกรรม", "/edit"]] as const;

export function EventTabs({ eventId, active = "" }: { eventId: string; active?: string }) {
  return <nav className="-mb-px flex gap-1 overflow-x-auto border-b border-line" aria-label="ส่วนของกิจกรรม">{tabs.map(([label, suffix]) => <Link key={suffix} href={`/admin/events/${eventId}${suffix}`} className={`focus-ring whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition ${active === suffix ? "border-primary text-primary" : "border-transparent text-muted hover:border-line hover:text-ink"}`}>{label}</Link>)}</nav>;
}