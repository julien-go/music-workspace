import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateTrackVersion } from "../hooks/useCreateTrackVersion";
import { useAudioFileInput } from "../hooks/useAudioFileInput";
import { dialogInputClass, dialogTextareaClass } from "@/features/projects/components/dialogStyles";
import { toastError, toastSuccess } from "@/lib/toast";
import { isUnauthorizedError, describeError } from "@/lib/api";

interface Props {
  projectId: string;
  trackId: string;
  open: boolean;
  onClose: () => void;
}

export function AddVersionDialog({ projectId, trackId, open, onClose }: Props) {
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const {
    file: audioFile,
    fileError,
    inputRef: fileInputRef,
    onChange: onFileChange,
    clear: clearFile,
  } = useAudioFileInput();
  const createVersion = useCreateTrackVersion(projectId, trackId);

  const handleClose = () => {
    setLabel("");
    setNotes("");
    setError(null);
    clearFile();
    createVersion.reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setError("Un fichier audio est requis.");
      return;
    }
    setError(null);
    createVersion.mutate(
      { file: audioFile, notes: notes.trim() || undefined, label: label.trim() || undefined },
      {
        onSuccess: () => {
          toastSuccess("Version uploadée avec succès");
          handleClose();
        },
        onError: (err) => {
          if (!isUnauthorizedError(err)) toastError(describeError(err, "Échec de l'upload, réessaie"));
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="bg-surface ring-border sm:max-w-md p-6 sm:p-8 gap-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">Nouvelle version</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="add-version-file" className="text-sm font-medium text-foreground">Fichier audio *</label>
            <div
              className="border border-dashed border-border rounded-md px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-accent/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="text-muted-foreground text-lg">🎵</span>
              <div className="flex-1 min-w-0">
                {audioFile ? (
                  <p className="text-sm text-foreground truncate">{audioFile.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Cliquer pour choisir un fichier audio…
                  </p>
                )}
              </div>
              {audioFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  aria-label="Retirer le fichier"
                  className="text-muted-foreground/50 hover:text-foreground text-xs"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="add-version-file"
              type="file"
              accept="audio/*"
              className="sr-only"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="add-version-label" className="text-sm font-medium text-foreground">Nom de la version</label>
            <input
              id="add-version-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nommer cette version…"
              className={dialogInputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="add-version-notes" className="text-sm font-medium text-foreground">Notes</label>
            <textarea
              id="add-version-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Décris les changements de cette version…"
              className={dialogTextareaClass}
            />
          </div>

          {(fileError ?? error) && (
            <p role="alert" className="text-xs text-destructive">{fileError ?? error}</p>
          )}

          {/* Announces upload progress to screen readers (success is announced by the toast). */}
          <p role="status" aria-live="polite" className="sr-only">
            {createVersion.isPending ? "Upload en cours…" : ""}
          </p>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={createVersion.isPending}>
              {createVersion.isPending ? "Upload…" : "Ajouter la version"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
