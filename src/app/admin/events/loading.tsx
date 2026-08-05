function Block({ className }: { className: string }) {
  return <div className={"animate-pulse rounded-md border border-line bg-white shadow-card " + className} aria-hidden="true" />;
}

export default function EventsLoading() {
  return <div role="status" aria-label="กำลังโหลดกิจกรรม">
    <div className="flex items-end justify-between gap-4"><div className="space-y-2.5"><div className="h-3 w-28 animate-pulse rounded bg-[#e8e8e8]" /><div className="h-7 w-52 animate-pulse rounded bg-[#e8e8e8]" /><div className="h-4 w-72 max-w-full animate-pulse rounded bg-[#e8e8e8]" /></div><div className="h-11 w-36 animate-pulse rounded bg-[#e8e8e8]" /></div>
    <Block className="mt-5 h-12" />
    <Block className="mt-5 h-40" />
    <div className="mt-5 grid gap-5 md:grid-cols-2"><Block className="h-72" /><Block className="h-72" /></div>
  </div>;
}