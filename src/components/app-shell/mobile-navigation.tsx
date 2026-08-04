"use client";

import Link from "next/link";
import { ClipboardCheck, LayoutDashboard, Settings2, UsersRound } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/admin/events", label: "กิจกรรม", icon: Settings2 },
  { href: "/scanner", label: "สแกน", icon: ClipboardCheck },
  { href: "/admin/users", label: "ผู้ใช้งาน", icon: UsersRound },
];

export function MobileNavigation({ showUsers, showScanner }: { showUsers: boolean; showScanner: boolean }) {
  const pathname = usePathname();
  const visibleItems = items.filter((item) => (item.href !== "/admin/users" || showUsers) && (item.href !== "/scanner" || showScanner));
  const navClassName = "fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[150] grid rounded-md border border-line bg-white p-1.5 shadow-soft lg:hidden";
  return <nav className={navClassName} style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }} aria-label="เมนูหลักบนมือถือ">{visibleItems.map((item) => {
    const Icon = item.icon;
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    const itemClassName = ["focus-ring flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-sm px-1 text-[10px] font-medium transition", active ? "bg-ink text-white" : "text-muted hover:bg-paper hover:text-ink"].join(" ");
    return <Link key={item.href} href={item.href} className={itemClassName} aria-current={active ? "page" : undefined}><Icon size={18} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" /><span className="max-w-full truncate">{item.label}</span></Link>;
  })}</nav>;
}
