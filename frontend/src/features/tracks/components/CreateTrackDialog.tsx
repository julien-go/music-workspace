import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createTrack, createTrackVersion } from "../api";
import { useAudioFileInput } from "../hooks/useAudioFileInput";
import { useQueryClient } from "@tanstack/react-query";
import { notifyError, toastSuccess } from "@/lib/toast";
import { queryKeys } from "@/lib/queryKeys";

interface Props {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

const schema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "100 caractères max"),
  description: z.string().max(500, "500 caractères max").optional(),
  versionLabel: z.string().max(100, "100 caractères max").optional(),
});

type FormData = z.infer<typeof schema>;

export function CreateTrackDialog({ projectId, open, onClose }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTrackId, setCreatedTrackId] = useState<string | null>(null);
  const {
    file: audioFile,
    fileError,
    inputRef: fileInputRef,
    onChange: onFileChange,
    clear: clearFile,
  } = useAudioFileInput();
  const queryClient = useQueryClient();

  const handleClose = () => {
    reset();
    clearFile();
    setCreatedTrackId(null);
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      let trackId = createdTrackId;
      if (!trackId) {
        const track = await createTrack(projectId, {
          name: data.name,
          description: data.description,
        });
        trackId = track.id;
        setCreatedTrackId(trackId);
      }
      if (audioFile) {
        await createTrackVersion(projectId, trackId, audioFile, {
          label: data.versionLabel?.trim() || undefined,
        });
        toastSuccess("Version uploadée avec succès");
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.tracks(projectId) });
      handleClose();
    } catch (err) {
      notifyError(
        err,
        audioFile ? "Échec de l'upload, réessaie" : "Impossible de créer la track, réessaie",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="bg-surface ring-border sm:max-w-md p-6 sm:p-8 gap-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">Nouvelle track</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-track-name" className="text-sm font-medium text-foreground">
              Nom *
            </label>
            <input
              id="create-track-name"
              {...register("name")}
              aria-invalid={errors.name ? true : undefined}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Ex: Intro, Couplet 1…"
            />
            {errors.name && (
              <p role="alert" className="text-xs text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-track-desc" className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="create-track-desc"
              {...register("description")}
              rows={2}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              placeholder="Description optionnelle"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-track-file" className="text-sm font-medium text-foreground">
              Audio (version initiale)
            </label>
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
              id="create-track-file"
              type="file"
              accept="audio/*"
              className="sr-only"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
            {fileError && (
              <p role="alert" className="text-xs text-destructive">
                {fileError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Optionnel — une première version sera créée automatiquement.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="create-track-version-label"
              className="text-sm font-medium text-foreground"
            >
              Nom de la version
            </label>
            <input
              id="create-track-version-label"
              {...register("versionLabel")}
              disabled={!audioFile}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Nommer cette version…"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création…" : "Créer la track"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
