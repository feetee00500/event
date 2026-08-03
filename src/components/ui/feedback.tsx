import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#efeeff] text-primary"><Info size={22} aria-hidden="true" /></div><h3 className="text-base font-semibold text-ink">{title}</h3><p className="mt-1 max-w-md text-sm text-muted">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div>;
}

export function InlineNotice({ tone, children }: { tone: "success" | "error" | "info"; children: ReactNode }) {
  const config = { success: { className: "border-[#b9f0df] bg-[#effcf8] text-[#087a5b]", Icon: CheckCircle2 }, error: { className: "border-[#ffcaca] bg-[#fff4f4] text-[#b82d2d]", Icon: TriangleAlert }, info: { className: "border-[#dcd9ff] bg-[#f7f6ff] text-[#4f47cf]", Icon: Info } }[tone];
  return <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-sm border px-3.5 py-3 text-sm ${config.className}`}><config.Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" /><div>{children}</div></div>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`shimmer animate-shimmer rounded-sm ${className}`} />;
}
