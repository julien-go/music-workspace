import { Copy, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toastError, toastSuccess } from "@/lib/toast";
import { isUnauthorizedError, describeError } from "@/lib/api";
import { useUpdateProject } from "../hooks/useUpdateProject";
import type { ProjectResponse } from "../types";

interface Props {
  project: ProjectResponse;
}

export function ShareProjectButton({ project }: Props) {
  const updateProject = useUpdateProject(project.id);
  const publicUrl = `${window.location.origin}/p/${project.id}`;

  const setVisibility = (isPublic: boolean) => {
    updateProject.mutate(
      { isPublic },
      {
        onError: (err) => {
          if (!isUnauthorizedError(err)) {
            toastError(
              describeError(err, "Impossible de modifier la visibilité du projet."),
            );
          }
        },
      },
    );
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toastSuccess("Lien copié");
    } catch {
      toastError("Impossible de copier le lien.");
    }
  };

  if (!project.isPublic) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setVisibility(true)}
        disabled={updateProject.isPending}
        className="gap-1.5"
      >
        <Globe className="w-4 h-4" aria-hidden="true" />
        {updateProject.isPending ? "…" : "Rendre public"}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 min-w-0 rounded-md border border-border bg-surface px-2.5 py-1.5">
        <Globe className="w-4 h-4 shrink-0 text-accent" aria-hidden="true" />
        <span className="truncate text-sm text-muted-foreground">{publicUrl}</span>
        <button
          type="button"
          onClick={copyUrl}
          aria-label="Copier le lien public"
          title="Copier le lien public"
          className="shrink-0 rounded text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <Copy className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setVisibility(false)}
        disabled={updateProject.isPending}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <Lock className="w-4 h-4" aria-hidden="true" />
        {updateProject.isPending ? "…" : "Rendre privé"}
      </Button>
    </div>
  );
}
