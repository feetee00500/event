import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Base = { label: string; hint?: string; error?: string; className?: string; htmlFor?: string };

export function Field({ label, hint, error, className = "", htmlFor, children }: Base & { children: ReactNode }) {
  return <div className={className}><label htmlFor={htmlFor} className="mb-1.5 block break-words text-xs font-medium text-ink">{label}</label>{children}{error ? <p className="mt-1.5 text-xs font-medium text-danger">{error}</p> : hint ? <p className="mt-1.5 text-xs leading-5 text-muted">{hint}</p> : null}</div>;
}

const inputClass = "focus-ring h-11 w-full rounded-sm border border-line bg-white px-3.5 text-base text-ink outline-none transition placeholder:text-[#888888] focus:border-ink focus:ring-1 focus:ring-ink/10";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />; }
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />; }
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className={`${inputClass} min-h-28 py-3 ${props.className ?? ""}`} />; }
