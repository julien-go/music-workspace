import { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { usePlayerStore } from "@/store/playerStore";
import { Pencil, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useProject } from "./hooks/useProject";
import { useTracks } from "@/features/tracks/hooks/useTracks";
import { useArchivedTracks } from "@/features/tracks/hooks/useArchivedTracks";
import { TrackCard } from "@/features/tracks/components/TrackCard";
import { CreateTrackDialog } from "@/features/tracks/components/CreateTrackDialog";
import { TaskKanban } from "@/features/tasks/components/TaskKanban";
import { MembersSidebar } from "./components/MembersSidebar";
import { EditProjectDialog } from "./components/EditProjectDialog";
import { ProjectSettingsDialog } from "./components/ProjectSettingsDialog";
import { Button } from "@/components/ui/button";

function ProjectDetailSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 animate-pulse">
      <div className="flex gap-8">
        <div className="flex-1 space-y-6">
          <div className="h-8 w-64 bg-surface rounded" />
          <div className="h-4 w-96 bg-surface rounded" />
          <div className="space-y-3 mt-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-surface rounded-lg" />
            ))}
          </div>
        </div>
        <div className="w-72 shrink-0 h-64 bg-surface rounded-lg" />
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { projectId } = useParams({ strict: false }) as { projectId: string };
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tracks = [], isLoading: tracksLoading } = useTracks(projectId);

  const [createTrackOpen, setCreateTrackOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const { data: archivedTracks = [], isLoading: archivedLoading } = useArchivedTracks(projectId, showArchived);

  useEffect(() => {
    const current = usePlayerStore.getState().current;
    if (current && current.projectId !== projectId) {
      usePlayerStore.getState().stop();
    }
  }, [projectId]);

  if (projectLoading) return <ProjectDetailSkeleton />;
  if (!project) return null;

  const canEdit = project.currentUserRole === "OWNER" || project.currentUserRole === "COLLABORATOR";
  const isOwner = project.currentUserRole === "OWNER";

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex gap-8 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-foreground">{project.name}</span>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-2xl font-bold font-heading text-foreground leading-tight truncate">
                {project.name}
              </h1>
              {canEdit && (
                <button
                  onClick={() => setEditProjectOpen(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                  title="Modifier le titre"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            {isOwner && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-1"
                title="Paramètres du projet"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>

          {project.description ? (
            <div className="flex items-center gap-1.5 mb-8">
              <p className="text-sm text-muted-foreground">{project.description}</p>
              {canEdit && (
                <button
                  onClick={() => setEditProjectOpen(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Modifier la description"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : canEdit ? (
            <button
              onClick={() => setEditProjectOpen(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 flex items-center gap-1.5"
            >
              <Pencil className="w-4 h-4" />
              Ajouter une description
            </button>
          ) : (
            <div className="mb-8" />
          )}

          {/* Tracks section */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">
                Tracks
                {tracks.length > 0 && (
                  <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal">{tracks.length}</span>
                )}
              </h2>
              {canEdit && (
                <Button onClick={() => setCreateTrackOpen(true)}>
                  + Nouvelle track
                </Button>
              )}
            </div>

            {tracksLoading && (
              <div className="space-y-3 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 bg-surface rounded-lg" />
                ))}
              </div>
            )}

            {!tracksLoading && tracks.length === 0 && !showArchived && (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                <p className="text-base">Aucune track pour le moment.</p>
                {canEdit && (
                  <p className="text-sm mt-1">Créez votre première track pour commencer.</p>
                )}
              </div>
            )}

            {!tracksLoading && tracks.length > 0 && (
              <div className="space-y-3">
                {tracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    projectId={projectId}
                    projectName={project.name}
                    canEdit={canEdit}
                  />
                ))}
              </div>
            )}

            {/* Archived tracks toggle */}
            <div className="mt-6">
              <Separator className="mb-4" />
              <button
                onClick={() => setShowArchived((v) => !v)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <span>{showArchived ? "▾" : "▸"}</span>
                {showArchived ? "Masquer les tracks archivées" : "Afficher les tracks archivées"}
                {archivedTracks.length > 0 && (
                  <span className="text-muted-foreground/60">({archivedTracks.length})</span>
                )}
              </button>

              {showArchived && (
                <div className="mt-3">
                  {archivedLoading && (
                    <div className="space-y-3 animate-pulse">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-24 bg-surface rounded-lg opacity-60" />
                      ))}
                    </div>
                  )}
                  {!archivedLoading && archivedTracks.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4">Aucune track archivée.</p>
                  )}
                  {!archivedLoading && archivedTracks.length > 0 && (
                    <div className="space-y-3 opacity-70">
                      {archivedTracks.map((track) => (
                        <TrackCard
                          key={track.id}
                          track={track}
                          projectId={projectId}
                          projectName={project.name}
                          canEdit={canEdit}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Tasks section */}
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-5">
              Tâches
            </h2>
            <TaskKanban projectId={projectId} canEdit={canEdit} />
          </div>
        </div>

        {/* Sidebar — sticky */}
        <div className="w-72 shrink-0 sticky top-8">
          <MembersSidebar projectId={projectId} isOwner={isOwner} />
        </div>
      </div>

      {/* Modals */}
      <CreateTrackDialog
        projectId={projectId}
        open={createTrackOpen}
        onClose={() => setCreateTrackOpen(false)}
      />
      {canEdit && (
        <EditProjectDialog
          project={project}
          open={editProjectOpen}
          onClose={() => setEditProjectOpen(false)}
        />
      )}
      {isOwner && (
        <ProjectSettingsDialog
          project={project}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
