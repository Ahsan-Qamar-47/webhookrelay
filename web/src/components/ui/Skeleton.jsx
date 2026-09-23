export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded bg-relay-card-hover/60 border border-relay-border/40 ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3 animate-pulse" role="status" aria-label="Loading metric card">
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function TableRowSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2 p-4" role="status" aria-label="Loading table rows">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-4 py-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-14 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}
