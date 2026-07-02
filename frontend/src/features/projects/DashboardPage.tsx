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
    <div className="max-w-300 mx-auto px-4 md:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-foreground">Mes projets</h1>
        <Button
          onClick={() => setDialogOpen(true)}
          className="w-full md:w-auto"
        >
          Nouveau projet
        </Button>
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
          <FolderOpen
            className="w-12 h-12 text-muted-foreground"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div className="space-y-1" role="status">
            <p className="text-foreground font-medium">
              Aucun projet pour le moment
            </p>
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

      <CreateProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
