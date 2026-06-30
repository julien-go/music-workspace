import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { useVersionComments } from "../hooks/useVersionComments";
import { useAddVersionComment } from "../hooks/useAddVersionComment";
import { useDeleteVersionComment } from "../hooks/useDeleteVersionComment";
import { CommentThread } from "./CommentThread";
import { formatRelativeTime } from "@/lib/utils";
import type { TrackVersionResponse } from "../types";

interface Props {
  version: TrackVersionResponse;
  projectId: string;
  trackId: string;
  trackName: string;
  projectName: string;
  isOwner: boolean;
}

export function VersionCard({
  version,
  projectId,
  trackId,
  trackName,
  projectName,
  isOwner,
}: Props) {
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteCommentError, setDeleteCommentError] = useState<string | null>(null);

  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isCurrentVersion = current?.versionId === version.id;
  const isCurrentlyPlaying = isCurrentVersion && isPlaying;

  const currentUser = useAuthStore((s) => s.user);

  const { data: comments = [], isLoading: commentsLoading } = useVersionComments(
    projectId,
    trackId,
    version.id,
  );
  const addComment = useAddVersionComment(projectId, trackId, version.id);
  const deleteComment = useDeleteVersionComment(projectId, trackId, version.id);

  const handlePlay = () => {
    if (isCurrentVersion) {
      isCurrentlyPlaying ? pause() : resume();
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
    });
  };

  const handleDeleteComment = (commentId: string) => {
    setDeletingId(commentId);
    setDeleteCommentError(null);
    deleteComment.mutate(commentId, {
      onSettled: () => setDeletingId(null),
      onError: () => setDeleteCommentError("Impossible de supprimer ce commentaire."),
    });
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-accent border-accent/40 font-mono text-base font-bold px-3 py-1">
            v{version.versionNumber}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(version.createdAt)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlay}
          className={`text-sm h-8 px-3 shrink-0 ${isCurrentlyPlaying ? "text-accent" : ""}`}
        >
          {isCurrentlyPlaying ? "⏸ En lecture" : isCurrentVersion ? "▶ Reprendre" : "▶ Écouter"}
        </Button>
      </div>

      {version.notes && (
        <p className="text-base text-foreground/70 whitespace-pre-wrap mb-3">{version.notes}</p>
      )}

      <div className="border-t border-border/50 pt-3">
        <button
          onClick={() => setCommentsOpen((v) => !v)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <span>{commentsOpen ? "▾" : "▸"}</span>
          Commentaires
          {!commentsOpen && comments.length > 0 && (
            <span className="text-muted-foreground/60">({comments.length})</span>
          )}
        </button>

        {commentsOpen && (
          <div className="mt-4">
            <CommentThread
              comments={comments}
              isLoading={commentsLoading}
              currentUserId={currentUser?.id}
              isOwner={isOwner}
              onAdd={(content) => addComment.mutateAsync(content)}
              isAdding={addComment.isPending}
              onDelete={handleDeleteComment}
              deletingId={deletingId}
              deleteError={deleteCommentError}
            />
          </div>
        )}
      </div>
    </div>
  );
}
