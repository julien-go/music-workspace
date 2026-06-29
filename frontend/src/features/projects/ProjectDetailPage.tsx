import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDndContext,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Music, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { InlineEdit } from "@/components/InlineEdit";
import { useProject } from "./hooks/useProject";
import { useUpdateProject } from "./hooks/useUpdateProject";
import { useTracks } from "@/features/tracks/hooks/useTracks";
import { useArchivedTracks } from "@/features/tracks/hooks/useArchivedTracks";
import { useReorderTracks } from "@/features/tracks/hooks/useReorderTracks";
import { TrackCard } from "@/features/tracks/components/TrackCard";
import { CreateTrackDialog } from "@/features/tracks/components/CreateTrackDialog";
import { TaskKanban } from "@/features/tasks/components/TaskKanban";
import { MembersSidebar } from "./components/MembersSidebar";
import { ProjectSettingsDialog } from "./components/ProjectSettingsDialog";
import { useStopPlayerOnProjectChange } from "./hooks/useStopPlayerOnProjectChange";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { TrackResponse } from "@/features/tracks/types";

function SortableTrackCard({
  track,
  projectId,
  projectName,
  canEdit,
  reorderPending,
}: {
  track: TrackResponse;
  projectId: string;
  projectName: string;
  canEdit: boolean;
  reorderPending: boolean;
}) {
  const { active } = useDndContext();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
    disabled: !canEdit || reorderPending,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        // Transition uniquement pendant le drag actif — évite l'animation
        // des transforms résiduels au moment où le DOM se réordonne au drop.
        transition: active ? transition : undefined,
      }}
      className={`flex items-center gap-2 group/sort ${
        isDragging ? "relative z-50 opacity-80 shadow-2xl scale-[1.01]" : ""
      }`}
    >
      {canEdit && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="shrink-0 p-0.5 opacity-40 group-hover/sort:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground focus-visible:outline-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <TrackCard
          track={track}
          projectId={projectId}
          projectName={projectName}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}

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
  const reorderTracks = useReorderTracks(projectId);

  // useState (not setQueryData) so the update batches synchronously with dnd-kit's own state cleanup.
  const [orderedIds, setOrderedIds] = useState<string[]>(() => tracks.map((t) => t.id));
  const prevServerIdsRef = useRef<string[]>(tracks.map((t) => t.id));
  useEffect(() => {
    const serverIds = tracks.map((t) => t.id);
    const prev = new Set(prevServerIdsRef.current);
    const next = new Set(serverIds);
    prevServerIdsRef.current = serverIds;
    // Only reset local order when the *set* of IDs changes (track added or archived).
    // A refetch with same IDs but server-side order must not clobber the user's drag order.
    const setsMatch = prev.size === next.size && [...next].every((id) => prev.has(id));
    if (!setsMatch) setOrderedIds(serverIds);
  }, [tracks]);
  const orderedTracks = useMemo(
    () => orderedIds.map((id) => tracks.find((t) => t.id === id)).filter((t): t is TrackResponse => t !== undefined),
    [orderedIds, tracks],
  );

  const sensors = useSensors(useSensor(PointerSensor));
  const [createTrackOpen, setCreateTrackOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const { data: archivedTracks = [], isLoading: archivedLoading, isError: isArchivedError } =
    useArchivedTracks(projectId, showArchived);

  useStopPlayerOnProjectChange(projectId);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = orderedIds.indexOf(active.id as string);
    const newIndex = orderedIds.indexOf(over.id as string);
    const newIds = arrayMove(orderedIds, oldIndex, newIndex);
    const previousIds = orderedIds;

    setOrderedIds(newIds);

    reorderTracks.mutate(
      { trackIds: newIds },
      { onError: () => setOrderedIds(previousIds) },
    );
  };

  if (projectLoading) return <ProjectDetailSkeleton />;
  if (projectError)
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          Ce projet est introuvable ou vous n'y avez pas accès.
        </p>
        <Link to="/dashboard" className="text-sm text-accent hover:underline">
          Retour au dashboard
        </Link>
      </div>
    );
  if (!project) return null;

  const canEdit =
    project.currentUserRole === "OWNER" || project.currentUserRole === "COLLABORATOR";
  const isOwner = project.currentUserRole === "OWNER";

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex gap-8 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
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
                onSave={
                  canEdit ? (description) => updateProject.mutateAsync({ description }) : undefined
                }
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
                  <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal">
                    {tracks.length}
                  </span>
                )}
              </h2>
              {canEdit && (
                <Button onClick={() => setCreateTrackOpen(true)}>+ Nouvelle track</Button>
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={orderedIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-3">
                    {orderedTracks.map((track) => (
                      <SortableTrackCard
                        key={track.id}
                        track={track}
                        projectId={projectId}
                        projectName={project.name}
                        canEdit={canEdit}
                        reorderPending={reorderTracks.isPending}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
                    <p className="text-sm text-destructive">
                      Impossible de charger les tracks archivées.
                    </p>
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
