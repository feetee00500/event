import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-48 flex-col items-center justify-center rounded-sm bg-paper px-6 py-12 text-center"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-muted shadow-subtle"><Info size={19} aria-hidden="true" /></div><h3 className="text-base font-medium text-ink">{title}</h3><p className="mt-1 max-w-md text-sm leading-6 text-muted">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div>;
}

export function InlineNotice({ tone, children }: { tone: "success" | "error" | "info"; children: ReactNode }) {
  const config = { success: { className: "border-[#b8d8ff] bg-[#eef6ff] text-[#0761d1]", Icon: CheckCircle2 }, error: { className: "border-[#f4b7bb] bg-[#fff4f4] text-[#c50000]", Icon: TriangleAlert }, info: { className: "border-[#d7c7f1] bg-[#faf7ff] text-[#4c2889]", Icon: Info } }[tone];
  return <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-sm border px-3.5 py-3 text-sm ${config.className}`}><config.Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" /><div>{children}</div></div>;
}

export function DataLoadNotice({ resource }: { resource: string }) {
  return <InlineNotice tone="error">ไม่สามารถโหลด{resource}ได้ในขณะนี้ ระบบยังไม่พร้อมเชื่อมต่อฐานข้อมูล กรุณาลองใหม่อีกครั้ง</InlineNotice>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`shimmer animate-shimmer rounded-sm ${className}`} />;
}
