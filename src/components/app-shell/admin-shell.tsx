"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ClipboardCheck, LayoutDashboard, LogOut, Menu, RadioTower, Settings2, UsersRound } from "lucide-react";
import { useState } from "react";
import { roleLabel } from "@/lib/permissions";
import type { CurrentUser } from "@/lib/auth";
import { EVENT_SCOPE_NAME, PRODUCT_NAME } from "@/lib/branding";
import { MobileNavigation } from "@/components/app-shell/mobile-navigation";

const baseNav = [
  { href: "/admin/dashboard", label: "ภาพรวมระบบ", icon: LayoutDashboard },
  { href: "/admin/events", label: "กิจกรรมทั้งหมด", icon: Settings2 },
  { href: "/scanner", label: "สแกนเข้างาน", icon: ClipboardCheck },
  { href: "/admin/users", label: "ผู้ใช้งาน", icon: UsersRound, superAdminOnly: true },
];

export function AdminShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = baseNav.filter((item) => !item.superAdminOnly || user.role === "SUPER_ADMIN");
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-[100dvh] bg-canvas">
      <aside className={"fixed inset-y-0 left-0 z-[200] w-72 transform border-r border-white/10 bg-navy text-white transition-transform duration-200 lg:translate-x-0 " + (mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Operations Desk</span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7BDCB5]">
                <span className="h-1.5 w-1.5 rounded-full bg-signal" /> Live
              </span>
            </div>
            <Link href="/admin/dashboard" className="focus-ring block rounded-sm" onClick={closeMobile}>
              <span className="block text-3xl font-semibold tracking-[-0.06em]">{PRODUCT_NAME}</span>
              <span className="mt-1 block text-sm tracking-[0.32em] text-white/60">{EVENT_SCOPE_NAME}</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-5" aria-label="เมนูหลัก">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  aria-current={active ? "page" : undefined}
                  className={"focus-ring relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition " + (active ? "bg-white text-ink" : "text-white/65 hover:bg-white/10 hover:text-white")}
                >
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  {item.label}
                  {active ? <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-sm border border-white/10 bg-white/5 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-signal text-xs font-bold text-ink">{user.name.slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-white/50">{roleLabel(user.role)}</p>
              </div>
            </div>
            <button type="button" className="focus-ring flex min-h-11 w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-white/55 hover:bg-white/5 hover:text-white" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut size={16} aria-hidden="true" />ออกจากระบบ
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen ? <button className="fixed inset-0 z-[100] bg-ink/50 lg:hidden" aria-label="ปิดเมนู" onClick={closeMobile} /> : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-[90] flex h-16 items-center justify-between border-b border-ink/10 bg-paper px-4 sm:px-6">
          <button type="button" className="focus-ring flex h-11 w-11 items-center justify-center rounded-sm text-muted lg:hidden" aria-label="เปิดเมนู" onClick={() => setMobileOpen(true)}>
            <Menu size={21} />
          </button>
          <div className="hidden items-center gap-3 lg:flex">
            <RadioTower size={17} className="text-primary" aria-hidden="true" />
            <div>
              <p className="mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{PRODUCT_NAME}</p>
              <p className="text-sm font-semibold">ระบบควบคุมการลงทะเบียนและเข้างาน</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold">{user.name}</span>
              <span className="block text-xs text-muted">{roleLabel(user.role)}</span>
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-ink/10 bg-white text-sm font-bold text-primary" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-[1320px] px-4 pb-24 pt-6 sm:px-6 sm:pb-8 sm:pt-8">{children}</main>
      </div>
      <MobileNavigation showUsers={user.role === "SUPER_ADMIN"} />
    </div>
  );
}