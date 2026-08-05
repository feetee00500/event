function Block({ className }: { className: string }) {
  return <div className={"animate-pulse rounded-md border border-line bg-white shadow-card " + className} aria-hidden="true" />;
}

export default function UsersLoading() {
  return <div role="status" aria-label="กำลังโหลดผู้ใช้งาน">
    <div className="flex items-end justify-between gap-4"><div className="space-y-2.5"><div className="h-3 w-32 animate-pulse rounded bg-[#e8e8e8]" /><div className="h-7 w-56 animate-pulse rounded bg-[#e8e8e8]" /><div className="h-4 w-80 max-w-full animate-pulse rounded bg-[#e8e8e8]" /></div><div className="h-11 w-36 animate-pulse rounded bg-[#e8e8e8]" /></div>
    <Block className="mt-6 h-36" />
    <Block className="mt-5 h-80" />
  </div>;
}