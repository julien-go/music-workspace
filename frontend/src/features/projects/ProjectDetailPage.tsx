import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useStopPlayerOnProjectChange } from "./hooks/useStopPlayerOnProjectChange";
import { Music, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { InlineEdit } from "@/components/InlineEdit";
import { useProject } from "./hooks/useProject";
import { useUpdateProject } from "./hooks/useUpdateProject";
import { useTracks } from "@/features/tracks/hooks/useTracks";
import { useArchivedTracks } from "@/features/tracks/hooks/useArchivedTracks";
import { TrackCard } from "@/features/tracks/components/TrackCard";
import { CreateTrackDialog } from "@/features/tracks/components/CreateTrackDialog";
import { TaskKanban } from "@/features/tasks/components/TaskKanban";
import { MembersSidebar } from "./components/MembersSidebar";
import { ProjectSettingsDialog } from "./components/ProjectSettingsDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

function ProjectCover({ name, coverUrl }: { name: string; coverUrl: string | null }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  if (coverUrl) {
    return (
      <>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="shrink-0 rounded-lg overflow-hidden hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          title="Voir en grand"
        >
          <img src={coverUrl} alt={name} className="w-32 h-32 object-cover" />
        </button>
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="bg-surface p-3 sm:max-w-md">
            <DialogTitle className="sr-only">{name}</DialogTitle>
            <img src={coverUrl} alt={name} className="w-full aspect-square object-cover rounded-md" />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="w-32 h-32 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
      {initials ? (
        <span className="text-2xl font-semibold text-muted-foreground">{initials}</span>
      ) : (
        <Music className="w-8 h-8 text-muted-foreground" />
      )}
    </div>
  );
}

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
  const { data: project, isLoading: projectLoading, isError: projectError } = useProject(projectId);
  const { data: tracks = [], isLoading: tracksLoading, isError: isTracksError } = useTracks(projectId);
  const updateProject = useUpdateProject(projectId);

  const [createTrackOpen, setCreateTrackOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const { data: archivedTracks = [], isLoading: archivedLoading, isError: isArchivedError } = useArchivedTracks(projectId, showArchived);

  useStopPlayerOnProjectChange(projectId);

  if (projectLoading) return <ProjectDetailSkeleton />;
  if (projectError) return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 text-center space-y-3">
      <p className="text-sm text-muted-foreground">Ce projet est introuvable ou vous n'y avez pas accès.</p>
      <Link to="/dashboard" className="text-sm text-accent hover:underline">Retour au dashboard</Link>
    </div>
  );
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
          <div className="flex items-start gap-4 mb-8">
            <ProjectCover name={project.name} coverUrl={project.coverUrl} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <InlineEdit
                  value={project.name}
                  onSave={canEdit ? (name) => updateProject.mutateAsync({ name }) : undefined}
                  className="text-2xl font-bold font-heading text-foreground leading-tight"
                />
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

              <InlineEdit
                value={project.description ?? ""}
                onSave={canEdit ? (description) => updateProject.mutateAsync({ description }) : undefined}
                multiline
                className="text-sm text-muted-foreground whitespace-pre-wrap"
                emptyLabel={canEdit ? "Ajouter une description" : undefined}
              />
            </div>
          </div>

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

            {!tracksLoading && isTracksError && (
              <p className="text-sm text-destructive">Impossible de charger les tracks.</p>
            )}

            {!tracksLoading && !isTracksError && tracks.length === 0 && !showArchived && (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                <p className="text-base">Aucune track pour le moment.</p>
                {canEdit && (
                  <p className="text-sm mt-1">Créez votre première track pour commencer.</p>
                )}
              </div>
            )}

            {!tracksLoading && !isTracksError && tracks.length > 0 && (
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
                  {!archivedLoading && isArchivedError && (
                    <p className="text-sm text-destructive">Impossible de charger les tracks archivées.</p>
                  )}
                  {!archivedLoading && !isArchivedError && archivedTracks.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4">Aucune track archivée.</p>
                  )}
                  {!archivedLoading && !isArchivedError && archivedTracks.length > 0 && (
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
      {canEdit && (
        <CreateTrackDialog
          projectId={projectId}
          open={createTrackOpen}
          onClose={() => setCreateTrackOpen(false)}
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
