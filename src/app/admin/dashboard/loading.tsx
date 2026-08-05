function Block({ className }: { className: string }) {
  return <div className={"animate-pulse rounded-md border border-line bg-white shadow-card " + className} aria-hidden="true" />;
}

export default function DashboardLoading() {
  return <div role="status" aria-label="กำลังโหลดภาพรวมระบบ">
    <Block className="h-64 sm:h-72" />
    <div className="mt-6 space-y-3"><div className="h-5 w-44 animate-pulse rounded bg-[#e8e8e8]" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <Block key={index} className="h-32" />)}</div></div>
    <div className="mt-7 grid gap-6 xl:grid-cols-[1.18fr_.82fr]"><Block className="h-80" /><Block className="h-80" /></div>
  </div>;
}