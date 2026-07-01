import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ErrorState";
import { SkeletonProjectList } from "@/components/SkeletonProjectList";
import { describeError } from "@/lib/api";
import { useProjects } from "./hooks/useProjects";
import { ProjectCard } from "./components/ProjectCard";
import { CreateProjectDialog } from "./components/CreateProjectDialog";

export default function DashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: projects, isLoading, isError, error, refetch } = useProjects();

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">Mes projets</h1>
        <Button onClick={() => setDialogOpen(true)}>Nouveau projet</Button>
      </div>

      {/* Loading */}
      {isLoading && <SkeletonProjectList />}

      {/* Error */}
      {isError && (
        <ErrorState
          message={describeError(error, "Impossible de charger les projets.")}
          onRetry={() => refetch()}
        />
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
