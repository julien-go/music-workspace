import { Separator } from "@/components/ui/separator";
import { TrackCard } from "@/features/tracks/components/TrackCard";
import type { TrackResponse } from "@/features/tracks/types";

function ArchivedList({
  archivedLoading,
  isArchivedError,
  archivedTracks,
  projectId,
  projectName,
  canEdit,
}: {
  archivedLoading: boolean;
  isArchivedError: boolean;
  archivedTracks: TrackResponse[];
  projectId: string;
  projectName: string;
  canEdit: boolean;
}) {
  if (archivedLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-24 bg-surface rounded-lg opacity-60" />
        ))}
      </div>
    );
  }
  if (isArchivedError) {
    return (
      <p className="text-sm text-destructive">
        Impossible de charger les tracks archivées.
      </p>
    );
  }
  if (archivedTracks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">Aucune track archivée.</p>
    );
  }
  return (
    <div className="space-y-3 opacity-70">
      {archivedTracks.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          projectId={projectId}
          projectName={projectName}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}

export function ArchivedTracksSection({
  showArchived,
  onToggle,
  archivedTracks,
  archivedLoading,
  isArchivedError,
  projectId,
  projectName,
  canEdit,
}: {
  showArchived: boolean;
  onToggle: () => void;
  archivedTracks: TrackResponse[];
  archivedLoading: boolean;
  isArchivedError: boolean;
  projectId: string;
  projectName: string;
  canEdit: boolean;
}) {
  return (
    <div className="mt-6">
      <Separator className="mb-4" />
      <button
        onClick={onToggle}
        aria-expanded={showArchived}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
      >
        <span aria-hidden="true">{showArchived ? "▾" : "▸"}</span>
        {showArchived
          ? "Masquer les tracks archivées"
          : "Afficher les tracks archivées"}
        {archivedTracks.length > 0 && (
          <span className="text-muted-foreground/60">
            ({archivedTracks.length})
          </span>
        )}
      </button>

      {showArchived && (
        <div className="mt-3">
          <ArchivedList
            archivedLoading={archivedLoading}
            isArchivedError={isArchivedError}
            archivedTracks={archivedTracks}
            projectId={projectId}
            projectName={projectName}
            canEdit={canEdit}
          />
        </div>
      )}
    </div>
  );
}
