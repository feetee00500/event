function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md border border-line bg-white shadow-card ${className}`} aria-hidden="true" />;
}

export default function AdminLoading() {
  return (
    <div role="status" aria-label="กำลังโหลดข้อมูล">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2.5">
          <div className="h-2.5 w-28 animate-pulse rounded-sm bg-[#e8e8e8]" />
          <div className="h-6 w-52 animate-pulse rounded-sm bg-[#e8e8e8]" />
          <div className="h-3.5 w-72 max-w-full animate-pulse rounded-sm bg-[#e8e8e8]" />
        </div>
        <div className="hidden h-10 w-32 animate-pulse rounded-md bg-[#e8e8e8] sm:block" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
      </div>
      <SkeletonBlock className="mt-6 h-64" />
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-72" />
      </div>
    </div>
  );
}
