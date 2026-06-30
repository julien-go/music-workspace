import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateTrackVersion } from "../hooks/useCreateTrackVersion";
import { dialogTextareaClass } from "@/features/projects/components/dialogStyles";

interface Props {
  projectId: string;
  trackId: string;
  open: boolean;
  onClose: () => void;
}

export function AddVersionDialog({ projectId, trackId, open, onClose }: Props) {
  const [notes, setNotes] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createVersion = useCreateTrackVersion(projectId, trackId);

  const handleClose = () => {
    setNotes("");
    setAudioFile(null);
    setError(null);
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
      { file: audioFile, notes: notes.trim() || undefined },
      {
        onSuccess: handleClose,
        onError: (err) =>
          setError(err instanceof Error ? err.message : "Une erreur est survenue"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="bg-surface ring-border sm:max-w-md p-8 gap-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">Nouvelle version</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Fichier audio *</label>
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
                    setAudioFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-muted-foreground/50 hover:text-foreground text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Décris les changements de cette version…"
              className={dialogTextareaClass}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

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
