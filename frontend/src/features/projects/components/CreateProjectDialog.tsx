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

const schema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "100 caractères max"),
  description: z.string().max(500, "500 caractères max").optional(),
});

type FormData = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-colors";

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
            <label className="text-sm font-medium text-foreground">Nom du projet</label>
            <input
              placeholder="Mon album, EP Printemps…"
              {...register("name")}
              className={inputClass}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Description <span className="text-muted-foreground font-normal">(optionnelle)</span>
            </label>
            <textarea
              placeholder="Décrivez votre projet…"
              rows={4}
              {...register("description")}
              className={`${inputClass} resize-none`}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {create.error && (
            <p className="text-sm text-destructive">{create.error.message}</p>
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
