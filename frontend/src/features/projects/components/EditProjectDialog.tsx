import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpdateProject } from "../hooks/useUpdateProject";
import type { ProjectResponse, UpdateProjectRequest } from "../types";

interface Props {
  project: ProjectResponse;
  open: boolean;
  focusField?: "name" | "description";
  onClose: () => void;
}

export function EditProjectDialog({ project, open, focusField = "name", onClose }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateProjectRequest>({
    defaultValues: { name: project.name, description: project.description ?? "" },
  });
  const updateProject = useUpdateProject(project.id);
  const [serverError, setServerError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  const { ref: nameFormRef, ...nameRest } = register("name", { required: "Le nom est requis" });
  const { ref: descriptionFormRef, ...descriptionRest } = register("description");

  const handleClose = () => {
    reset({ name: project.name, description: project.description ?? "" });
    setServerError(null);
    onClose();
  };

  const onSubmit = (data: UpdateProjectRequest) => {
    setServerError(null);
    updateProject.mutate(data, {
      onSuccess: () => handleClose(),
      onError: (err) => {
        setServerError(err instanceof Error ? err.message : "Une erreur est survenue");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="bg-surface ring-border sm:max-w-md p-8 gap-6"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          if (focusField === "description") {
            descriptionRef.current?.focus();
          } else {
            nameRef.current?.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">Modifier le projet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Nom *</label>
            <input
              {...nameRest}
              ref={(el) => { nameRef.current = el; nameFormRef(el); }}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              {...descriptionRest}
              ref={(el) => { descriptionRef.current = el; descriptionFormRef(el); }}
              rows={3}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>
          {serverError && <p className="text-xs text-red-400">{serverError}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose}>Annuler</Button>
            <Button type="submit" disabled={updateProject.isPending}>
              {updateProject.isPending ? "Sauvegarde…" : "Sauvegarder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
