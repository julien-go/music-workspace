import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useUpdateProject } from "../hooks/useUpdateProject";
import { useDeleteProject } from "../hooks/useDeleteProject";
import type { ProjectResponse, UpdateProjectRequest } from "../types";

interface Props {
  project: ProjectResponse;
  open: boolean;
  onClose: () => void;
}

export function ProjectSettingsDialog({ project, open, onClose }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateProjectRequest>({
    defaultValues: { name: project.name, description: project.description ?? "" },
  });
  const updateProject = useUpdateProject(project.id);
  const deleteProject = useDeleteProject();
  const navigate = useNavigate();

  const [confirming, setConfirming] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleClose = () => {
    reset({ name: project.name, description: project.description ?? "" });
    updateProject.reset();
    setConfirming(false);
    setEditError(null);
    setDeleteError(null);
    onClose();
  };

  const onEditSubmit = (data: UpdateProjectRequest) => {
    setEditError(null);
    updateProject.mutate(data, {
      onError: (err) => setEditError(err instanceof Error ? err.message : "Une erreur est survenue"),
    });
  };

  const handleDelete = () => {
    setDeleteError(null);
    deleteProject.mutate(project.id, {
      onSuccess: () => {
        handleClose();
        navigate({ to: "/dashboard" });
      },
      onError: (err) => {
        setDeleteError(err instanceof Error ? err.message : "Une erreur est survenue");
        setConfirming(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="bg-surface ring-border sm:max-w-md p-8 gap-0">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-heading font-bold">Paramètres du projet</DialogTitle>
        </DialogHeader>

        {/* Informations */}
        <form onSubmit={handleSubmit(onEditSubmit)} className="flex flex-col gap-4 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Informations</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Nom *</label>
            <input
              {...register("name", { required: "Le nom est requis" })}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              {...register("description")}
              rows={2}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>
          {editError && <p className="text-xs text-red-400">{editError}</p>}
          {updateProject.isSuccess && <p className="text-xs text-emerald-400">Sauvegardé.</p>}
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={updateProject.isPending}>
              {updateProject.isPending ? "Sauvegarde…" : "Sauvegarder"}
            </Button>
          </div>
        </form>

        <Separator className="mb-6" />

        {/* Cover image — placeholder */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Image de couverture</p>
          <div className="border border-dashed border-border rounded-md px-4 py-4 text-center">
            <p className="text-xs text-muted-foreground">Upload de cover — disponible prochainement.</p>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Danger zone */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Zone dangereuse</p>
          <p className="text-xs text-muted-foreground mb-4">
            La suppression est irréversible. Toutes les tracks, tâches et commentaires seront perdus.
          </p>
          {deleteError && <p className="text-xs text-red-400 mb-3">{deleteError}</p>}
          {!confirming ? (
            <Button variant="destructive" size="sm" onClick={() => setConfirming(true)} className="w-full">
              Supprimer le projet
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-center text-muted-foreground">Confirmer la suppression de « {project.name} » ?</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConfirming(false)}>Annuler</Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  disabled={deleteProject.isPending}
                  onClick={handleDelete}
                >
                  {deleteProject.isPending ? "Suppression…" : "Supprimer"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
