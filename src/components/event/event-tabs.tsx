import Link from "next/link";

const tabs = [["ภาพรวม", ""], ["ผู้เข้าร่วม", "/attendees"], ["บัตรและ QR", "/tickets"], ["จุดเข้างาน", "/gates"], ["ประวัติ Check-in", "/checkins"], ["รายงาน", "/reports"], ["ตั้งค่ากิจกรรม", "/edit"]] as const;

export function EventTabs({ eventId, active = "", canManage }: { eventId: string; active?: string; canManage: boolean }) {
  const visibleTabs = canManage ? tabs : tabs.filter(([, suffix]) => suffix !== "/edit");
  return <nav className="scrollbar-hidden -mb-px flex max-w-full min-w-0 gap-1 overflow-x-auto overscroll-x-contain border-b border-line" aria-label="ส่วนของกิจกรรม">{visibleTabs.map(([label, suffix]) => {
    const activeClassName = active === suffix ? "border-ink bg-paper text-ink" : "border-transparent text-muted hover:border-line hover:text-ink";
    return <Link key={suffix} href={`/admin/events/${eventId}${suffix}`} className={["focus-ring min-h-11 shrink-0 whitespace-nowrap rounded-t-sm border-b-2 px-3 py-3 text-sm font-medium transition", activeClassName].join(" ")}>{label}</Link>;
  })}</nav>;
}
