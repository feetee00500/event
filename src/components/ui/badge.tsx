import type { ReactNode } from "react";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";
type Props = { children: ReactNode; tone?: Tone; className?: string };

const tones: Record<Tone, string> = {
  neutral: "border border-ink/10 bg-ink/5 text-muted",
  primary: "border border-primary/20 bg-[#EAF6F3] text-primary",
  success: "border border-success/20 bg-[#eaf5f0] text-success",
  warning: "border border-warning/20 bg-[#faf2dd] text-warning",
  danger: "border border-danger/20 bg-[#fbeae8] text-danger",
};

export function Badge({ children, tone = "neutral", className = "" }: Props) {
  return <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className].join(" ")}>{children}</span>;
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