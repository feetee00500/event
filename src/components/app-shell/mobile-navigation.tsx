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

export function MobileNavigation({ showUsers }: { showUsers: boolean }) {
  const pathname = usePathname();
  const visibleItems = items.filter((item) => item.href !== "/admin/users" || showUsers);
  return <nav className={`fixed inset-x-3 bottom-3 z-[150] grid ${showUsers ? "grid-cols-4" : "grid-cols-3"} rounded-xl border border-line bg-white/95 p-1.5 shadow-[0_12px_34px_rgba(0,39,86,.18)] backdrop-blur lg:hidden`} aria-label="เมนูหลักบนมือถือ">{visibleItems.map((item) => { const Icon = item.icon; const active = pathname === item.href || pathname.startsWith(`${item.href}/`); return <Link key={item.href} href={item.href} className={`focus-ring flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-semibold ${active ? "bg-[#eaf6f3] text-primary" : "text-muted"}`} aria-current={active ? "page" : undefined}><Icon size={18} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />{item.label}</Link>; })}</nav>;
}