import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createTrack, createTrackVersion } from "../api";
import { useQueryClient } from "@tanstack/react-query";
import { toastError, toastSuccess } from "@/lib/toast";
import { isUnauthorizedError, describeError } from "@/lib/api";

interface Props {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

type FormData = {
  name: string;
  description?: string;
  versionLabel?: string;
};

export function CreateTrackDialog({ projectId, open, onClose }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTrackId, setCreatedTrackId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleClose = () => {
    reset();
    setAudioFile(null);
    setCreatedTrackId(null);
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      let trackId = createdTrackId;
      if (!trackId) {
        const track = await createTrack(projectId, { name: data.name, description: data.description });
        trackId = track.id;
        setCreatedTrackId(trackId);
      }
      if (audioFile) {
        await createTrackVersion(projectId, trackId, audioFile, undefined, data.versionLabel?.trim() || undefined);
        toastSuccess("Version uploadée avec succès");
      }
      queryClient.invalidateQueries({ queryKey: ["tracks", projectId] });
      handleClose();
    } catch (err) {
      if (!isUnauthorizedError(err)) {
        toastError(
          describeError(err, audioFile ? "Échec de l'upload, réessaie" : "Impossible de créer la track, réessaie"),
        );
      }
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
            <label className="text-sm font-medium text-foreground">Nom *</label>
            <input
              {...register("name", { required: "Le nom est requis" })}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Ex: Intro, Couplet 1…"
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              {...register("description")}
              rows={2}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              placeholder="Description optionnelle"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Audio (version initiale)</label>
            <div
              className="border border-dashed border-border rounded-md px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-accent/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="text-muted-foreground text-lg">🎵</span>
              <div className="flex-1 min-w-0">
                {audioFile ? (
                  <p className="text-sm text-foreground truncate">{audioFile.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Cliquer pour choisir un fichier audio…</p>
                )}
              </div>
              {audioFile && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setAudioFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
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
            <p className="text-xs text-muted-foreground">Optionnel — une première version sera créée automatiquement.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Nom de la version</label>
            <input
              {...register("versionLabel")}
              disabled={!audioFile}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Nommer cette version…"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création…" : "Créer la track"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
