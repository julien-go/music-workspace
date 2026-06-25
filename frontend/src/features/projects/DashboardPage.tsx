import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjects } from "./hooks/useProjects";
import { ProjectCard } from "./components/ProjectCard";
import { CreateProjectDialog } from "./components/CreateProjectDialog";

function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 bg-surface border border-border rounded-card animate-pulse">
      <div className="w-12 h-12 rounded-md bg-surface-elevated shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-40 rounded bg-surface-elevated" />
        <div className="h-3 w-24 rounded bg-surface-elevated" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-5 w-16 rounded bg-surface-elevated" />
        <div className="h-3 w-20 rounded bg-surface-elevated hidden md:block" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: projects, isLoading, isError } = useProjects();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">Mes projets</h1>
        <Button onClick={() => setDialogOpen(true)}>Nouveau projet</Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-sm text-destructive">
          Impossible de charger les projets. Réessayez plus tard.
        </p>
      )}

      {/* Empty state */}
      {!isLoading && !isError && projects?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <FolderOpen className="w-12 h-12 text-muted-foreground" strokeWidth={1.5} />
          <div className="space-y-1">
            <p className="text-foreground font-medium">Aucun projet pour le moment</p>
            <p className="text-sm text-muted-foreground">
              Créez votre premier projet pour commencer
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>Créer un projet</Button>
        </div>
      )}

      {/* Project list */}
      {!isLoading && !isError && projects && projects.length > 0 && (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
