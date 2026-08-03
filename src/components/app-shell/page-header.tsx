import type { ReactNode } from "react";
import { PRODUCT_NAME } from "@/lib/branding";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 border-b border-ink/15 pb-6 sm:flex sm:items-end sm:justify-between sm:gap-8">
      <div>
        <p className="eyebrow">{eyebrow ?? PRODUCT_NAME}</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-[2.5rem]">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-5 shrink-0 sm:mt-0">{action}</div> : null}
    </div>
  );
}