import { CommentThread } from "@/features/comments/components/CommentThread";
import type { useVersionCard } from "../hooks/useVersionCard";

type CardState = ReturnType<typeof useVersionCard>;

export function VersionComments({
  versionId,
  isOwner,
  card,
}: {
  versionId: string;
  isOwner: boolean;
  card: CardState;
}) {
  const controlsId = `version-comments-${versionId}`;
  return (
    <div className="border-t border-border/50 pt-3">
      <button
        onClick={() => card.setCommentsOpen((v) => !v)}
        aria-expanded={card.commentsOpen}
        aria-controls={controlsId}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
      >
        <span aria-hidden="true">{card.commentsOpen ? "▾" : "▸"}</span>
        Commentaires
        {!card.commentsOpen && card.comments.length > 0 && (
          <span className="text-muted-foreground/60">({card.comments.length})</span>
        )}
      </button>

      {card.commentsOpen && (
        <div id={controlsId} className="mt-4">
          <CommentThread
            comments={card.comments}
            isLoading={card.commentsLoading}
            loadError={card.commentsError}
            currentUserId={card.currentUser?.id}
            isOwner={isOwner}
            onAdd={(content) => card.addComment.mutateAsync(content)}
            isAdding={card.addComment.isPending}
            onDelete={(commentId) => card.deleteComment.mutateAsync(commentId)}
          />
        </div>
      )}
    </div>
  );
}
