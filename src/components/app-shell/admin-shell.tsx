"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ClipboardCheck, LayoutDashboard, LogOut, Menu, RadioTower, Settings2, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { hasPermission, roleLabel } from "@/lib/permissions";
import type { CurrentUser } from "@/lib/auth";
import { MobileNavigation } from "@/components/app-shell/mobile-navigation";

const baseNav = [
  { href: "/admin/dashboard", label: "ภาพรวมระบบ", icon: LayoutDashboard },
  { href: "/admin/events", label: "กิจกรรมทั้งหมด", icon: Settings2 },
  { href: "/scanner", label: "สแกนเข้างาน", icon: ClipboardCheck, checkinOnly: true },
  { href: "/admin/users", label: "ผู้ใช้งาน", icon: UsersRound, superAdminOnly: true },
];

export function AdminShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const showScanner = hasPermission(user.role, "checkin:write");
  const nav = baseNav.filter((item) => (!item.superAdminOnly || user.role === "SUPER_ADMIN") && (!item.checkinOnly || showScanner));
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-[100dvh] min-w-0 bg-canvas">
      <aside className={`fixed inset-y-0 left-0 z-[200] w-72 max-w-[calc(100vw-2rem)] transform overflow-y-auto overscroll-contain border-r border-line bg-white text-ink transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex min-h-full flex-col">
          <div className="border-b border-line px-5 pb-6 pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <span className="mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">Operations Desk</span>
              <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#0070f3]"><span className="h-1.5 w-1.5 rounded-full bg-[#50e3c2]" /> Live</span>
              <button type="button" className="focus-ring touch-target -mr-2 rounded-sm text-muted lg:hidden" aria-label="ปิดเมนู" onClick={closeMobile}><X size={18} /></button>
            </div>
            <Link href="/admin/dashboard" className="focus-ring block min-w-0 rounded-sm" onClick={closeMobile}>
              <span className="block break-words text-3xl font-semibold tracking-[-0.07em]">EVENT</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-5" aria-label="เมนูหลัก">
            <p className="mono mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.1em] text-muted">Workspace</p>
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return <Link key={item.href} href={item.href} onClick={closeMobile} aria-current={active ? "page" : undefined} className={`focus-ring relative flex min-h-11 items-center gap-3 rounded-sm px-3 py-3 text-sm font-medium transition ${active ? "bg-ink text-white shadow-subtle" : "text-muted hover:bg-paper hover:text-ink"}`}><Icon size={17} strokeWidth={1.8} aria-hidden="true" />{item.label}{active ? <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-[#50e3c2]" aria-hidden="true" /> : null}</Link>;
            })}
          </nav>

          <div className="border-t border-line p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mb-3 flex min-w-0 items-center gap-3 rounded-sm border border-line bg-paper p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-medium text-white">{user.name.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{user.name}</p><p className="truncate text-xs text-muted">{roleLabel(user.role)}</p></div></div>
            <button type="button" className="focus-ring flex min-h-11 w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-muted hover:bg-paper hover:text-ink" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut size={16} aria-hidden="true" />ออกจากระบบ</button>
          </div>
        </div>
      </aside>

      {mobileOpen ? <button className="fixed inset-0 z-[100] bg-ink/35 lg:hidden" aria-label="ปิดเมนู" onClick={closeMobile} /> : null}

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-[90] flex min-h-16 items-center justify-between gap-3 border-b border-line bg-white px-3 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] sm:px-6">
          <button type="button" className="focus-ring touch-target shrink-0 rounded-sm text-muted lg:hidden" aria-label="เปิดเมนู" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
          <div className="hidden min-w-0 items-center gap-3 lg:flex"><RadioTower size={17} className="shrink-0 text-link" aria-hidden="true" /><div className="min-w-0"><p className="mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted">EVENT</p><p className="truncate text-sm font-medium">ระบบควบคุมการลงทะเบียนและเข้างาน</p></div></div>
        </header>
        <main id="main-content" className="mx-auto min-w-0 max-w-[1400px] px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pb-8 sm:pt-8">{children}</main>
      </div>
      <MobileNavigation showUsers={user.role === "SUPER_ADMIN"} showScanner={showScanner} />
    </div>
  );
}
