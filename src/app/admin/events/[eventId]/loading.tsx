function Block({ className }: { className: string }) {
  return <div className={"animate-pulse rounded-md border border-line bg-white shadow-card " + className} aria-hidden="true" />;
}

export default function EventWorkspaceLoading() {
  return <div role="status" aria-label="กำลังโหลด Event workspace">
    <div className="space-y-2.5"><div className="h-3 w-32 animate-pulse rounded bg-[#e8e8e8]" /><div className="h-7 w-56 animate-pulse rounded bg-[#e8e8e8]" /><div className="h-4 w-80 max-w-full animate-pulse rounded bg-[#e8e8e8]" /></div>
    <div className="mt-5 flex gap-2 overflow-hidden border-b border-line pb-3">{Array.from({ length: 7 }, (_, index) => <div key={index} className="h-9 w-24 shrink-0 animate-pulse rounded bg-[#e8e8e8]" />)}</div>
    <Block className="mt-6 h-40" />
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Block key={index} className="h-28" />)}</div>
    <Block className="mt-6 h-72" />
  </div>;
}