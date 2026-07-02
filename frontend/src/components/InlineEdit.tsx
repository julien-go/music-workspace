import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";

interface Props {
  value: string;
  onSave?: (value: string) => Promise<unknown>;
  multiline?: boolean;
  className?: string;
  displayClassName?: string;
  emptyLabel?: string;
}

export function InlineEdit({
  value,
  onSave,
  multiline,
  className = "",
  displayClassName = "",
  emptyLabel,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

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
    const trimmed = draft.trim();
    if (trimmed === value.trim()) {
      cancel();
      return;
    }
    if (!trimmed && !multiline) return;
    setIsPending(true);
    setError(null);
    try {
      await onSave!(trimmed);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsPending(false);
    }
  };

  const fieldClassName = `${className} w-full bg-transparent border-0 border-b-2 border-accent/60 outline-none focus:border-accent placeholder:text-muted-foreground/50 transition-colors`;

  if (isEditing) {
    return (
      <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
        {multiline ? (
          <textarea
            ref={inputRef}
            value={draft}
            disabled={isPending}
            rows={3}
            placeholder={emptyLabel}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") cancel(); }}
            onBlur={() => { if (!isPending) cancel(); }}
            className={fieldClassName}
          />
        ) : (
          <input
            ref={inputRef}
            value={draft}
            disabled={isPending}
            placeholder={emptyLabel}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter") { e.preventDefault(); save(); }
            }}
            onBlur={() => { if (!isPending) cancel(); }}
            className={fieldClassName}
          />
        )}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        <div className="flex gap-3 mt-1.5">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={save}
            disabled={isPending}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            {isPending ? "Sauvegarde…" : "Valider"}
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={cancel}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-1.5 min-w-0">
      {value ? (
        <span className={`${className} ${displayClassName} block min-w-0`}>{value}</span>
      ) : emptyLabel ? (
        <span className="text-sm text-muted-foreground italic">{emptyLabel}</span>
      ) : null}
      {onSave && (
        <button
          onClick={startEditing}
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-events-none group-hover:pointer-events-auto focus-visible:pointer-events-auto transition-opacity shrink-0 text-muted-foreground hover:text-foreground mt-0.5"
          title="Modifier"
          aria-label="Modifier"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
