import { useState } from "react";

// Draft + pending/error state for the comment composer and per-comment
// deletion. The comment list itself is owned (fetched) by the parent and
// passed to CommentThread as props.
export function useCommentForm(
  onAdd: (content: string) => Promise<unknown>,
  onDelete: (commentId: string) => Promise<unknown>,
  isAdding: boolean,
) {
  const [draft, setDraft] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = (commentId: string) => {
    setDeletingId(commentId);
    setDeleteError(null);
    Promise.resolve(onDelete(commentId))
      .catch(() => setDeleteError("Impossible de supprimer ce commentaire."))
      .finally(() => setDeletingId(null));
  };

  const submitDraft = () => {
    if (!draft.trim() || isAdding) return;
    setAddError(null);
    onAdd(draft.trim())
      .then(() => setDraft(""))
      .catch(() => setAddError("Impossible d'envoyer le commentaire."));
  };

  return {
    draft,
    setDraft,
    addError,
    deletingId,
    deleteError,
    handleDelete,
    submitDraft,
  };
}
