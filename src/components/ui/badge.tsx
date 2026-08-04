import type { ReactNode } from "react";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";
type Props = { children: ReactNode; tone?: Tone; className?: string };

const tones: Record<Tone, string> = {
  neutral: "border border-ink/10 bg-paper text-muted",
  primary: "border border-ink/15 bg-[#f5f5f5] text-ink",
  success: "border border-[#b8d8ff] bg-[#d3e5ff] text-[#0761d1]",
  warning: "border border-[#f2d39c] bg-[#ffefcf] text-[#8a4b09]",
  danger: "border border-[#f4b7bb] bg-[#f7d4d6] text-[#c50000]",
};

export function Badge({ children, tone = "neutral", className = "" }: Props) {
  return <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", tones[tone], className].join(" ")}>{children}</span>;
}

export function statusTone(status: string): Tone {
  if (["ACTIVE", "PUBLISHED", "SUCCESS", "CHECKED_IN", "QR_GENERATED", "REGISTERED"].includes(status)) return "success";
  if (["DRAFT", "VIEWER", "EVENT_STAFF"].includes(status)) return "neutral";
  if (["CANCELLED", "EXPIRED", "INVALID_TOKEN", "TOO_LATE"].includes(status)) return "danger";
  return "warning";
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <Badge tone={statusTone(status)}>{label ?? status.replaceAll("_", " ")}</Badge>;
}
