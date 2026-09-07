import { Button } from "@/components/ui/button";
import { AddVersionDialog } from "./AddVersionDialog";
import type { useTrackActions } from "../hooks/useTrackActions";
import type { TrackResponse } from "../types";

function playLabel(isLoadingPlay: boolean, isCurrentlyPlaying: boolean, isCurrentTrack: boolean) {
  if (isLoadingPlay) return "…";
  if (isCurrentlyPlaying) return "⏸ En lecture";
  if (isCurrentTrack) return "▶ Reprendre";
  return "▶ Écouter dernière version";
}

type Props = {
  track: TrackResponse;
  projectId: string;
  canEdit: boolean;
  canEditContent: boolean;
  isCurrentTrack: boolean;
  isCurrentlyPlaying: boolean;
  actions: ReturnType<typeof useTrackActions>;
};

export function TrackActions({
  track,
  projectId,
  canEdit,
  canEditContent,
  isCurrentTrack,
  isCurrentlyPlaying,
  actions,
}: Props) {
  const noVersions = track.versionCount === 0;

  return (
    <div className="flex flex-col items-start gap-2 mt-1 md:flex-row md:items-center">
      {noVersions && canEditContent ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            actions.setAddVersionOpen(true);
          }}
          className="text-sm h-8 px-3"
        >
          + Ajouter une version
        </Button>
      ) : (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={actions.handlePlay}
            disabled={noVersions || actions.isLoadingPlay}
            className={`text-sm h-8 px-3 ${isCurrentlyPlaying ? "text-accent" : ""}`}
          >
            {playLabel(actions.isLoadingPlay, isCurrentlyPlaying, isCurrentTrack)}
          </Button>
          {actions.playError && (
            <span className="text-xs text-destructive">Impossible de charger l'audio.</span>
          )}
        </>
      )}

      {canEdit && !track.archived && !actions.confirmArchive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            actions.setConfirmArchive(true);
          }}
          aria-label={`Archiver ${track.name}`}
          className="text-sm h-8 px-3 text-muted-foreground hover:text-foreground"
        >
          Archiver
        </Button>
      )}
      {canEdit && !track.archived && actions.confirmArchive && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Archiver cette track ?</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              actions.setConfirmArchive(false);
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              actions.confirmArchiveAction();
            }}
            disabled={actions.archivePending}
            className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
          >
            {actions.archivePending ? "…" : "Confirmer"}
          </button>
        </div>
      )}
      {canEdit && track.archived && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            actions.unarchiveAction();
          }}
          disabled={actions.unarchivePending}
          aria-label={`Désarchiver ${track.name}`}
          className="text-sm h-8 px-3 text-muted-foreground hover:text-foreground"
        >
          Désarchiver
        </Button>
      )}

      <AddVersionDialog
        projectId={projectId}
        trackId={track.id}
        open={actions.addVersionOpen}
        onClose={() => actions.setAddVersionOpen(false)}
      />
    </div>
  );
}
