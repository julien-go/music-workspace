import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateProject } from "../hooks/useCreateProject";
import { describeError } from "@/lib/api";
import { dialogInputClass, dialogTextareaClass } from "./dialogStyles";

const schema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "100 caractères max"),
  description: z.string().max(500, "500 caractères max").optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateProjectDialog({ open, onClose }: Props) {
  const create = useCreateProject();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function onSubmit(data: FormData) {
    create.mutate(
      { name: data.name, description: data.description || undefined },
      {
        onSuccess: (project) => {
          reset();
          onClose();
          router.navigate({ to: "/projects/$projectId", params: { projectId: project.id } });
        },
      }
    );
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-surface ring-border sm:max-w-lg p-8 gap-6">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">Nouveau projet</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="create-project-name" className="text-sm font-medium text-foreground">Nom du projet</label>
            <input
              id="create-project-name"
              placeholder="Mon album, EP Printemps…"
              {...register("name")}
              aria-invalid={errors.name ? true : undefined}
              className={dialogInputClass}
              autoFocus
            />
            {errors.name && (
              <p role="alert" className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-project-desc" className="text-sm font-medium text-foreground">
              Description <span className="text-muted-foreground font-normal">(optionnelle)</span>
            </label>
            <textarea
              id="create-project-desc"
              placeholder="Décrivez votre projet…"
              rows={4}
              {...register("description")}
              className={dialogTextareaClass}
            />
            {errors.description && (
              <p role="alert" className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {create.error && (
            <p role="alert" className="text-sm text-destructive">
              {describeError(create.error, "Impossible de créer le projet. Réessaie.")}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Création…" : "Créer le projet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
