import { useState } from "react";
import { formatRelativeTime } from "@/lib/utils";
import type { CommentResponse } from "@/features/comments/types";

interface Props {
  comments: CommentResponse[];
  isLoading: boolean;
  currentUserId?: string;
  isOwner: boolean;
  onAdd: (content: string) => Promise<void>;
  isAdding: boolean;
  onDelete: (commentId: string) => void;
  deletingId?: string | null;
  deleteError?: string | null;
}

export function CommentThread({
  comments,
  isLoading,
  currentUserId,
  isOwner,
  onAdd,
  isAdding,
  onDelete,
  deletingId,
  deleteError,
}: Props) {
  const [draft, setDraft] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const submitDraft = () => {
    if (!draft.trim() || isAdding) return;
    setAddError(null);
    onAdd(draft.trim())
      .then(() => setDraft(""))
      .catch(() => setAddError("Impossible d'envoyer le commentaire."));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitDraft();
  };

  return (
    <div className="flex flex-col gap-4">
      {isLoading && (
        <div className="space-y-2 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-10 bg-surface rounded" />
          ))}
        </div>
      )}

      {!isLoading && comments.length === 0 && (
        <p className="text-sm text-muted-foreground italic">Aucun commentaire.</p>
      )}

      {!isLoading && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => {
            const isAuthor = currentUserId != null && currentUserId === comment.author.id;
            const canDelete = isOwner || isAuthor;
            return (
              <div key={comment.id} className="flex items-start gap-2 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      @{comment.author.username}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => onDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-red-400 text-xs shrink-0 mt-0.5 disabled:opacity-50"
                  >
                    {deletingId === comment.id ? "…" : "✕"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitDraft();
            }
          }}
          rows={2}
          placeholder="Ajouter un commentaire… (Entrée pour envoyer, Maj+Entrée pour saut de ligne)"
          disabled={isAdding}
          className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isAdding}
          className="text-sm text-accent hover:text-accent/80 transition-colors disabled:opacity-40 shrink-0 pb-2"
        >
          {isAdding ? "…" : "Envoyer"}
        </button>
      </form>

      {addError && <p className="text-xs text-destructive mt-1">{addError}</p>}
    </div>
  );
}
