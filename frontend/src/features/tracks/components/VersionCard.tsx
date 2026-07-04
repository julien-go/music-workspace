import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { useVersionComments } from "../hooks/useVersionComments";
import { useAddVersionComment } from "../hooks/useAddVersionComment";
import { useDeleteVersionComment } from "../hooks/useDeleteVersionComment";
import { useUpdateTrackVersion } from "../hooks/useUpdateTrackVersion";
import { CommentThread } from "@/features/comments/components/CommentThread";
import { InlineEdit } from "@/components/InlineEdit";
import { formatRelativeTime, getFileExtension, stripFileExtension } from "@/lib/utils";
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
  const [commentsOpen, setCommentsOpen] = useState(true);

  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isCurrentVersion = current?.versionId === version.id;
  const isCurrentlyPlaying = isCurrentVersion && isPlaying;

  const currentUser = useAuthStore((s) => s.user);

  const updateVersion = useUpdateTrackVersion(projectId, trackId, version.id);

  const fileExtension = getFileExtension(version.originalFileName);
  const fallbackName = version.originalFileName
    ? stripFileExtension(version.originalFileName)
    : null;
  const title = version.label ?? fallbackName;

  const {
    data: comments = [],
    isLoading: commentsLoading,
    isError: commentsError,
  } = useVersionComments(projectId, trackId, version.id);
  const addComment = useAddVersionComment(projectId, trackId, version.id);
  const deleteComment = useDeleteVersionComment(projectId, trackId, version.id);

  const handlePlay = () => {
    if (isCurrentVersion) {
      if (isCurrentlyPlaying) pause();
      else resume();
      return;
    }
    play({
      projectId,
      projectName,
      trackId,
      trackName,
      versionId: version.id,
      versionNumber: version.versionNumber,
      audioUrl: version.audioUrl,
      notes: version.notes,
      label: version.label,
      originalFileName: version.originalFileName,
    });
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-5 shadow-card">
      <h3 className="sr-only">
        Version {version.versionNumber} — {trackName}
      </h3>
      <div className="flex flex-col items-start gap-2 mb-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
          <Badge variant="outline" className="text-accent border-accent/40 font-mono text-base font-bold px-3 py-1 shrink-0">
            v{version.versionNumber}
          </Badge>
          {canEdit ? (
            <div className="min-w-0 flex-1">
              <InlineEdit
                value={version.label ?? ""}
                onSave={(label) => updateVersion.mutateAsync({ label })}
                ariaLabel={`Nom de la version ${version.versionNumber}`}
                className="text-base font-medium text-foreground"
                emptyLabel={fallbackName ?? "Nommer cette version"}
              />
            </div>
          ) : (
            title && (
              <span className="text-base font-medium text-foreground truncate">{title}</span>
            )
          )}
          {fileExtension && (
            <Badge variant="outline" className="text-muted-foreground border-border font-mono text-xs shrink-0">
              {fileExtension}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground shrink-0">
            {formatRelativeTime(version.createdAt)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlay}
          aria-label={
            isCurrentlyPlaying
              ? `Mettre en pause ${trackName} v${version.versionNumber}`
              : `Écouter ${trackName} v${version.versionNumber}`
          }
          className={`text-sm h-8 px-3 shrink-0 ${isCurrentlyPlaying ? "text-accent" : ""}`}
        >
          {isCurrentlyPlaying ? "⏸ En lecture" : isCurrentVersion ? "▶ Reprendre" : "▶ Écouter"}
        </Button>
      </div>

      {canEdit ? (
        <div className="mb-3">
          <InlineEdit
            value={version.notes ?? ""}
            onSave={(notes) => updateVersion.mutateAsync({ notes })}
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

      <div className="border-t border-border/50 pt-3">
        <button
          onClick={() => setCommentsOpen((v) => !v)}
          aria-expanded={commentsOpen}
          aria-controls={`version-comments-${version.id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <span aria-hidden="true">{commentsOpen ? "▾" : "▸"}</span>
          Commentaires
          {!commentsOpen && comments.length > 0 && (
            <span className="text-muted-foreground/60">({comments.length})</span>
          )}
        </button>

        {commentsOpen && (
          <div id={`version-comments-${version.id}`} className="mt-4">
            <CommentThread
              comments={comments}
              isLoading={commentsLoading}
              loadError={commentsError}
              currentUserId={currentUser?.id}
              isOwner={isOwner}
              onAdd={(content) => addComment.mutateAsync(content)}
              isAdding={addComment.isPending}
              onDelete={(commentId) => deleteComment.mutateAsync(commentId)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
