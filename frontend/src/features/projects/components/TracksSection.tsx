import { DndContext, closestCenter, useDndContext, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { SensorDescriptor, SensorOptions } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { TrackCard } from "@/features/tracks/components/TrackCard";
import type { TrackResponse } from "@/features/tracks/types";
import { ArchivedTracksSection } from "./ArchivedTracksSection";

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
          aria-label={`Réordonner ${track.name}`}
          {...attributes}
          {...listeners}
          className="shrink-0 p-0.5 touch-none opacity-100 md:opacity-40 md:group-hover/sort:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground focus-visible:outline-none"
        >
          <GripVertical className="w-4 h-4" aria-hidden="true" />
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

function ActiveTracks({
  tracksLoading,
  isTracksError,
  tracks,
  showArchived,
  canEdit,
  sensors,
  onDragEnd,
  orderedIds,
  orderedTracks,
  reorderPending,
  projectId,
  projectName,
}: TracksSectionProps) {
  if (tracksLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 bg-surface rounded-lg" />
        ))}
      </div>
    );
  }
  if (isTracksError) {
    return <p className="text-sm text-destructive">Impossible de charger les tracks.</p>;
  }
  if (tracks.length === 0) {
    if (showArchived) return null;
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
        <p className="text-base">Aucune track pour le moment.</p>
        {canEdit && <p className="text-sm mt-1">Créez votre première track pour commencer.</p>}
      </div>
    );
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {orderedTracks.map((track) => (
            <SortableTrackCard
              key={track.id}
              track={track}
              projectId={projectId}
              projectName={projectName}
              canEdit={canEdit}
              reorderPending={reorderPending}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export type TracksSectionProps = {
  tracks: TrackResponse[];
  tracksLoading: boolean;
  isTracksError: boolean;
  canEdit: boolean;
  onCreateTrack: () => void;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragEnd: (event: DragEndEvent) => void;
  orderedIds: string[];
  orderedTracks: TrackResponse[];
  reorderPending: boolean;
  showArchived: boolean;
  onToggleArchived: () => void;
  archivedTracks: TrackResponse[];
  archivedLoading: boolean;
  isArchivedError: boolean;
  projectId: string;
  projectName: string;
};

export function TracksSection(props: TracksSectionProps) {
  const { tracks, canEdit, onCreateTrack } = props;

  return (
    <div className="mb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">
          Tracks
          {tracks.length > 0 && (
            <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal">
              {tracks.length}
            </span>
          )}
        </h2>
        {canEdit && (
          <Button onClick={onCreateTrack} className="w-full md:w-auto">
            + Nouvelle track
          </Button>
        )}
      </div>

      <ActiveTracks {...props} />

      <ArchivedTracksSection
        showArchived={props.showArchived}
        onToggle={props.onToggleArchived}
        archivedTracks={props.archivedTracks}
        archivedLoading={props.archivedLoading}
        isArchivedError={props.isArchivedError}
        projectId={props.projectId}
        projectName={props.projectName}
        canEdit={canEdit}
      />
    </div>
  );
}
