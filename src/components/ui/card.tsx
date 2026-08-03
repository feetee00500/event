import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={`surface ${className}`} {...props}>{children}</div>;
}

export function CardHeader({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={`border-b border-line px-5 py-4 sm:px-6 ${className}`} {...props}>{children}</div>;
}

export function CardContent({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={`px-5 py-5 sm:px-6 ${className}`} {...props}>{children}</div>;
}
