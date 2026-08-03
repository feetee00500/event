import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatCard({ label, value, detail, icon: Icon, tone = "primary" }: { label: string; value: string | number; detail: string; icon: LucideIcon; tone?: "primary" | "success" | "warning" }) {
  const colors = { primary: "bg-[#EAF6F3] text-primary", success: "bg-[#e4faf3] text-[#087a5b]", warning: "bg-[#fff7d6] text-[#806300]" };
  return <Card className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-muted">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight">{value}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-sm ${colors[tone]}`}><Icon size={20} aria-hidden="true" /></span></div><div className="mt-5 flex items-center gap-1 text-xs text-muted"><ArrowUpRight size={14} className="text-success" aria-hidden="true" />{detail}</div></Card>;
}
