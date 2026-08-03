import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Base = { label: string; hint?: string; error?: string; className?: string };

export function Field({ label, hint, error, className = "", children }: Base & { children: ReactNode }) {
  return <div className={className}><label className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>{children}{error ? <p className="mt-1.5 text-xs font-medium text-danger">{error}</p> : hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}</div>;
}

const inputClass = "focus-ring h-11 w-full rounded-sm border border-line bg-white px-3.5 text-sm text-ink outline-none transition placeholder:text-[#a5a5b2] focus:border-primary";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} min-h-28 py-3 ${props.className ?? ""}`} />;
}
