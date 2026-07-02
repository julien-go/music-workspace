function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 bg-surface border border-border rounded-card">
      <div className="w-12 h-12 rounded-md bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-40 rounded bg-muted" />
        <div className="h-3 w-24 rounded bg-muted" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-5 w-16 rounded bg-muted" />
        <div className="h-3 w-20 rounded bg-muted hidden md:block" />
      </div>
    </div>
  );
}

/** Loading placeholder for the dashboard project list. */
export function SkeletonProjectList() {
  return (
    <div className="space-y-3 animate-pulse" role="status">
      <span className="sr-only">Chargement des projets…</span>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
