import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg"; href?: string; target?: AnchorHTMLAttributes<HTMLAnchorElement>["target"]; rel?: string; children: ReactNode };

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-[#087A6F] shadow-soft",
  secondary: "border border-ink/20 bg-white text-ink hover:border-ink/35 hover:bg-paper",
  ghost: "text-muted hover:bg-ink/5 hover:text-ink",
  danger: "bg-danger text-white hover:bg-[#8f1b13] shadow-soft",
};
const sizes = { sm: "h-10 px-3 text-xs", md: "h-11 px-4 text-sm", lg: "h-12 px-5 text-base" };

export function Button({ variant = "primary", size = "md", href, target, rel, className = "", children, ...props }: Props) {
  const classes = ["focus-ring inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition duration-200 active:translate-y-px disabled:opacity-50", variants[variant], sizes[size], className].join(" ");
  if (href) return <Link className={classes} href={href} target={target} rel={rel}>{children}</Link>;
  return <button className={classes} {...props}>{children}</button>;
}