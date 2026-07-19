import { Music } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CoverCropDialog } from "./CoverCropDialog";
import { useProjectSettings } from "../hooks/useProjectSettings";
import { cldThumb } from "@/lib/cloudinary";
import type { ProjectResponse } from "../types";
import { dialogInputClass, dialogTextareaClass } from "./dialogStyles";

interface Props {
  project: ProjectResponse;
  open: boolean;
  onClose: () => void;
}

type Settings = ReturnType<typeof useProjectSettings>;

function InfoForm({ settings }: { settings: Settings }) {
  const { register, errors, updateProject, editError } = settings;
  return (
    <form onSubmit={settings.submit} className="flex flex-col gap-4 mb-6">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Informations
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="project-settings-name" className="text-sm font-medium text-foreground">
          Nom *
        </label>
        <input
          id="project-settings-name"
          {...register("name", { required: "Le nom est requis" })}
          aria-invalid={errors.name ? true : undefined}
          className={dialogInputClass}
        />
        {errors.name && (
          <p role="alert" className="text-xs text-red-400">
            {errors.name.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="project-settings-desc" className="text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="project-settings-desc"
          {...register("description")}
          rows={2}
          className={dialogTextareaClass}
        />
      </div>
      {editError && (
        <p role="alert" className="text-xs text-red-400">
          {editError}
        </p>
      )}
      {updateProject.isSuccess && (
        <p role="status" className="text-xs text-emerald-400">
          Sauvegardé.
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={updateProject.isPending}>
          {updateProject.isPending ? "Sauvegarde…" : "Sauvegarder"}
        </Button>
      </div>
    </form>
  );
}

function CoverSection({ project, settings }: { project: ProjectResponse; settings: Settings }) {
  const { uploadCover } = settings;
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Image de couverture
      </p>
      <div className="flex items-center gap-4">
        {project.coverUrl ? (
          <img
            src={cldThumb(project.coverUrl, 64)}
            alt={project.name}
            loading="lazy"
            decoding="async"
            className="w-16 h-16 rounded-md object-cover shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-md bg-surface border border-dashed border-border flex items-center justify-center shrink-0">
            <Music className="w-6 h-6 text-muted-foreground/50" />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploadCover.isPending}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                settings.pickCoverFile(file);
                e.target.value = "";
              }}
            />
            <span className="text-sm text-accent hover:text-accent/80 transition-colors">
              {uploadCover.isPending
                ? "Upload…"
                : project.coverUrl
                  ? "Changer l'image"
                  : "Choisir une image"}
            </span>
          </label>
          {uploadCover.isError && <p className="text-xs text-red-400">Erreur lors de l'upload.</p>}
        </div>
      </div>
    </div>
  );
}

function DangerZone({ project, settings }: { project: ProjectResponse; settings: Settings }) {
  const { confirming, setConfirming, deleteError, deleteProject } = settings;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Zone dangereuse
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        La suppression est irréversible. Toutes les tracks, tâches et commentaires seront perdus.
      </p>
      {deleteError && <p className="text-xs text-red-400 mb-3">{deleteError}</p>}
      {!confirming ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirming(true)}
          className="w-full"
        >
          Supprimer le projet
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-center text-muted-foreground">
            Confirmer la suppression de « {project.name} » ?
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => setConfirming(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              disabled={deleteProject.isPending}
              onClick={settings.handleDelete}
            >
              {deleteProject.isPending ? "Suppression…" : "Supprimer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectSettingsDialog({ project, open, onClose }: Props) {
  const settings = useProjectSettings(project, onClose);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) settings.handleClose();
        }}
      >
        <DialogContent className="bg-surface ring-border sm:max-w-md p-8 gap-0">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-heading font-bold">
              Paramètres du projet
            </DialogTitle>
          </DialogHeader>

          <InfoForm settings={settings} />
          <Separator className="mb-6" />
          <CoverSection project={project} settings={settings} />
          <Separator className="mb-6" />
          <DangerZone project={project} settings={settings} />
        </DialogContent>
      </Dialog>

      {settings.cropImageSrc && (
        <CoverCropDialog
          imageSrc={settings.cropImageSrc}
          open={true}
          onClose={settings.clearCrop}
          onCrop={settings.applyCrop}
        />
      )}
    </>
  );
}
