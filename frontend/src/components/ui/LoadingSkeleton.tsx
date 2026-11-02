interface LoadingSkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: LoadingSkeletonProps) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b border-slate-100 p-5 last:border-b-0">
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="hidden h-9 w-28 sm:block" />
          <Skeleton className="hidden h-9 w-36 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: cards }, (_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="mt-3 h-4 w-3/5" />
          <Skeleton className="mt-6 h-3 w-1/3" />
          <div className="mt-5 flex gap-2"><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /></div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6" aria-busy="true" aria-live="polite">
      <div className="flex items-end justify-between gap-4">
        <div className="w-full space-y-3"><Skeleton className="h-3 w-28" /><Skeleton className="h-8 w-56 max-w-full" /><Skeleton className="h-4 w-80 max-w-full" /></div>
        <Skeleton className="h-11 w-36 shrink-0" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5"><Skeleton className="h-4 w-1/2" /><Skeleton className="mt-4 h-8 w-1/3" /></div>)}
      </div>
      <ListSkeleton rows={3} />
      <span className="sr-only">Loading page content...</span>
    </div>
  );
}
