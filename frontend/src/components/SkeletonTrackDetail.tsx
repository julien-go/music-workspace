/** Loading placeholder for the track detail view (version cards + comments + sidebar). */
export function SkeletonTrackDetail() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 animate-pulse">
      <div className="flex gap-8 items-start">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-10">
          {/* Breadcrumb */}
          <div className="h-3.5 w-72 max-w-full rounded bg-muted" />

          {/* Title + description */}
          <div className="space-y-3">
            <div className="h-8 w-64 max-w-full rounded bg-muted" />
            <div className="h-4 w-96 max-w-full rounded bg-muted" />
          </div>

          {/* Versions */}
          <div className="space-y-3">
            <div className="h-4 w-20 rounded bg-muted" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-muted" />
            ))}
          </div>

          {/* Comments */}
          <div className="space-y-3">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-20 rounded-lg bg-muted" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0 h-64 rounded-lg bg-muted" />
      </div>
    </div>
  );
}
