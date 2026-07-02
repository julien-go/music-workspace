/** Loading placeholder for the project detail view (header + tracks + tasks + sidebar). */
export function SkeletonProjectDetail() {
  return (
    <div
      className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 animate-pulse"
      role="status"
    >
      <span className="sr-only">Chargement du projet…</span>
      <div className="flex gap-8 items-start">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-10">
          {/* Header: cover + title/description */}
          <div className="flex items-start gap-4">
            <div className="w-32 h-32 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 min-w-0 space-y-3 pt-2">
              <div className="h-7 w-64 max-w-full rounded bg-muted" />
              <div className="h-4 w-96 max-w-full rounded bg-muted" />
            </div>
          </div>

          {/* Tracks column */}
          <div className="space-y-3">
            <div className="h-4 w-24 rounded bg-muted" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-lg bg-muted" />
            ))}
          </div>

          {/* Tasks column */}
          <div className="space-y-3">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-40 rounded-lg bg-muted" />
          </div>
        </div>

        {/* Sidebar — desktop only (mobile uses the drawer) */}
        <div className="hidden md:block w-72 shrink-0 h-64 rounded-lg bg-muted" />
      </div>
    </div>
  );
}
