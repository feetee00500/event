import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg"; href?: string; target?: AnchorHTMLAttributes<HTMLAnchorElement>["target"]; rel?: string; children: ReactNode };

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-subtle hover:bg-black hover:shadow-soft",
  secondary: "border border-ink/15 bg-white text-ink shadow-none hover:border-ink/30 hover:bg-paper",
  ghost: "text-ink hover:bg-paper hover:text-ink",
  danger: "bg-danger text-white shadow-subtle hover:bg-[#c50000] hover:shadow-soft",
};
const sizes = { sm: "min-h-10 px-3 py-2 text-xs", md: "min-h-11 px-4 py-2 text-sm", lg: "min-h-12 px-5 py-2.5 text-base" };

export function Button({ variant = "primary", size = "md", href, target, rel, className = "", children, ...props }: Props) {
  const classes = ["focus-ring inline-flex min-w-0 max-w-full items-center justify-center gap-2 rounded-sm text-center font-medium leading-5 transition duration-200 active:translate-y-px disabled:opacity-50", variants[variant], sizes[size], className].join(" ");
  if (href) return <Link className={classes} href={href} target={target} rel={rel}>{children}</Link>;
  return <button className={classes} {...props}>{children}</button>;
}
