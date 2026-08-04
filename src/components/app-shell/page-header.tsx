import type { ReactNode } from "react";
import { PRODUCT_NAME } from "@/lib/branding";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 min-w-0 border-b border-line pb-7 sm:flex sm:items-end sm:justify-between sm:gap-8">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow ?? PRODUCT_NAME}</p>
        <h1 className="mt-3 max-w-3xl break-words text-[clamp(1.875rem,6vw,3rem)] font-semibold leading-[1.08] tracking-[-0.055em]">{title}</h1>
        {description ? <p className="mt-4 max-w-2xl break-words text-base leading-7 text-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-6 flex min-w-0 max-w-full flex-wrap gap-2 sm:mt-0 sm:shrink-0 sm:justify-end">{action}</div> : null}
    </div>
  );
}
