import { InlineEdit } from "@/components/InlineEdit";
import { useVersionCard } from "../hooks/useVersionCard";
import { useVersionActions } from "../hooks/useVersionActions";
import { VersionCardHeader } from "./VersionCardHeader";
import { VersionComments } from "./VersionComments";
import type { TrackVersionResponse } from "../types";

interface Props {
  version: TrackVersionResponse;
  projectId: string;
  trackId: string;
  trackName: string;
  projectName: string;
  isOwner: boolean;
  canEdit: boolean;
}

export function VersionCard({
  version,
  projectId,
  trackId,
  trackName,
  projectName,
  isOwner,
  canEdit,
}: Props) {
  const card = useVersionCard(version, projectId, trackId);
  const { isCurrentVersion, isCurrentlyPlaying, handlePlay } = useVersionActions(version, {
    projectId,
    projectName,
    trackId,
    trackName,
  });

  return (
    <div className="bg-surface border border-border rounded-lg p-5 shadow-card">
      <h3 className="sr-only">
        Version {version.versionNumber} — {trackName}
      </h3>

      <VersionCardHeader
        version={version}
        canEdit={canEdit}
        title={card.title}
        fallbackName={card.fallbackName}
        fileExtension={card.fileExtension}
        updateVersion={card.updateVersion}
        trackName={trackName}
        isCurrentVersion={isCurrentVersion}
        isCurrentlyPlaying={isCurrentlyPlaying}
        onPlay={handlePlay}
      />

      {canEdit ? (
        <div className="mb-3">
          <InlineEdit
            value={version.notes ?? ""}
            onSave={(notes) => card.updateVersion.mutateAsync({ notes })}
            multiline
            ariaLabel={`Note de la version ${version.versionNumber}`}
            className="text-base text-foreground/70 whitespace-pre-wrap"
            emptyLabel="Ajouter une note"
          />
        </div>
      ) : (
        version.notes && (
          <p className="text-base text-foreground/70 whitespace-pre-wrap mb-3">{version.notes}</p>
        )
      )}

      <VersionComments versionId={version.id} isOwner={isOwner} card={card} />
    </div>
  );
}
