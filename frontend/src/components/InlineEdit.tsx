import { Pencil, Check, X } from "lucide-react";
import { useInlineEdit } from "./hooks/useInlineEdit";

interface Props {
  value: string;
  onSave?: (value: string) => Promise<unknown>;
  multiline?: boolean;
  className?: string;
  displayClassName?: string;
  emptyLabel?: string;
  /** Accessible name for the editable field (and its edit button). */
  ariaLabel?: string;
}

type Edit = ReturnType<typeof useInlineEdit>;

function EditField({
  edit,
  multiline,
  emptyLabel,
  ariaLabel,
  className,
}: {
  edit: Edit;
  multiline?: boolean;
  emptyLabel?: string;
  ariaLabel?: string;
  className: string;
}) {
  const fieldClassName = `${className} w-full bg-transparent border-0 border-b-2 border-accent/60 outline-none focus:border-accent placeholder:text-muted-foreground/50 transition-colors`;

  const shared = {
    ref: edit.inputRef,
    value: edit.draft,
    disabled: edit.isPending,
    placeholder: emptyLabel,
    "aria-label": ariaLabel,
    onBlur: () => {
      if (!edit.isPending) edit.cancel();
    },
    className: fieldClassName,
  };

  return (
    <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
      {multiline ? (
        <textarea
          {...shared}
          rows={3}
          onChange={(e) => edit.setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") edit.cancel();
          }}
        />
      ) : (
        <input
          {...shared}
          onChange={(e) => edit.setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") edit.cancel();
            if (e.key === "Enter") {
              e.preventDefault();
              edit.save();
            }
          }}
        />
      )}
      {edit.error && (
        <p role="alert" className="text-xs text-destructive mt-1">
          {edit.error}
        </p>
      )}
      <div className="flex gap-3 mt-1.5">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={edit.save}
          disabled={edit.isPending}
          className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          {edit.isPending ? "Sauvegarde…" : "Valider"}
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={edit.cancel}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Annuler
        </button>
      </div>
    </div>
  );
}

function DisplayField({
  value,
  className,
  displayClassName,
  emptyLabel,
  ariaLabel,
  editable,
  onStartEditing,
}: {
  value: string;
  className: string;
  displayClassName: string;
  emptyLabel?: string;
  ariaLabel?: string;
  editable: boolean;
  onStartEditing: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="group flex items-start gap-1.5 min-w-0">
      {value ? (
        <span className={`${className} ${displayClassName} block min-w-0`}>
          {value}
        </span>
      ) : emptyLabel ? (
        <span className="text-sm text-muted-foreground italic">{emptyLabel}</span>
      ) : null}
      {editable && (
        <button
          onClick={onStartEditing}
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-events-none group-hover:pointer-events-auto focus-visible:pointer-events-auto transition-opacity shrink-0 text-muted-foreground hover:text-foreground mt-0.5"
          title="Modifier"
          aria-label={ariaLabel ? `Modifier : ${ariaLabel}` : "Modifier"}
        >
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function InlineEdit({
  value,
  onSave,
  multiline,
  className = "",
  displayClassName = "",
  emptyLabel,
  ariaLabel,
}: Props) {
  const edit = useInlineEdit(value, onSave, multiline);

  if (edit.isEditing) {
    return (
      <EditField
        edit={edit}
        multiline={multiline}
        emptyLabel={emptyLabel}
        ariaLabel={ariaLabel}
        className={className}
      />
    );
  }

  return (
    <DisplayField
      value={value}
      className={className}
      displayClassName={displayClassName}
      emptyLabel={emptyLabel}
      ariaLabel={ariaLabel}
      editable={!!onSave}
      onStartEditing={edit.startEditing}
    />
  );
}
