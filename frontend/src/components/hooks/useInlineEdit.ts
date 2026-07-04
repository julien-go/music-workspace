import { useState, useRef, useEffect } from "react";
import { describeError } from "@/lib/api";

export function useInlineEdit(
  value: string,
  onSave?: (value: string) => Promise<unknown>,
  multiline?: boolean,
) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  // Re-sync the draft during render ("adjust state on prop change" — no
  // effect); the guard prevents an infinite loop.
  if (!isEditing && value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      if (!multiline && inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing, multiline]);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(value);
    setError(null);
    setIsEditing(true);
  };

  const cancel = () => {
    setDraft(value);
    setError(null);
    setIsEditing(false);
  };

  const save = async () => {
    if (!onSave) return;
    const trimmed = draft.trim();
    if (trimmed === value.trim()) {
      cancel();
      return;
    }
    if (!trimmed && !multiline) return;
    setIsPending(true);
    setError(null);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } catch (err) {
      setError(describeError(err, "Impossible d'enregistrer. Réessaie."));
    } finally {
      setIsPending(false);
    }
  };

  return {
    isEditing,
    draft,
    setDraft,
    isPending,
    error,
    inputRef,
    startEditing,
    cancel,
    save,
  };
}
