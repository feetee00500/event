export default function ScannerLoading() {
  return (
    <div role="status" aria-label="กำลังโหลด Scanner">
      <div className="mb-5 h-4 w-36 animate-pulse rounded-sm bg-[#e8e8e8]" />
      <div className="mx-auto max-w-4xl overflow-hidden rounded-md border border-line bg-white shadow-card">
        <div className="border-b border-line p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="h-2.5 w-32 animate-pulse rounded-sm bg-[#e8e8e8]" />
              <div className="h-5 w-56 animate-pulse rounded-sm bg-[#e8e8e8]" />
            </div>
            <div className="h-9 w-40 animate-pulse rounded-sm bg-[#e8e8e8]" />
          </div>
        </div>
        <div className="aspect-square animate-pulse bg-paper" />
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <div className="h-10 animate-pulse rounded-sm bg-[#e8e8e8]" />
          <div className="h-10 animate-pulse rounded-sm bg-[#e8e8e8]" />
        </div>
      </div>
    </div>
  );
}
