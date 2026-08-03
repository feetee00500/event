import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export type BreadcrumbItem = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="เส้นทางการใช้งาน" className="mb-4 flex min-w-0 items-center gap-1.5 overflow-x-auto text-xs text-muted">
      <Link href="/admin/dashboard" className="focus-ring inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-sm px-1.5 hover:text-primary">
        <Home size={14} aria-hidden="true" />
        <span className="sr-only">ภาพรวมระบบ</span>
      </Link>
      {items.map((item) => (
        <span key={`${item.label}-${item.href ?? "current"}`} className="inline-flex min-w-0 shrink-0 items-center gap-1.5">
          <ChevronRight size={13} aria-hidden="true" />
          {item.href ? <Link href={item.href} className="focus-ring rounded-sm px-1.5 hover:text-primary">{item.label}</Link> : <span className="truncate px-1.5 font-semibold text-ink">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
