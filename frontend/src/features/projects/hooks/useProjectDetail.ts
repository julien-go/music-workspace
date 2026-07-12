import { useState, useEffect, useMemo, useRef } from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { notifyError } from "@/lib/toast";
import { useAuthStore } from "@/store/authStore";
import { useTracks } from "@/features/tracks/hooks/useTracks";
import { useArchivedTracks } from "@/features/tracks/hooks/useArchivedTracks";
import { useReorderTracks } from "@/features/tracks/hooks/useReorderTracks";
import type { TrackResponse } from "@/features/tracks/types";
import { useProject } from "./useProject";
import { useUpdateProject } from "./useUpdateProject";
import { useProjectComments } from "./useProjectComments";
import { useAddProjectComment } from "./useAddProjectComment";
import { useDeleteProjectComment } from "./useDeleteProjectComment";
import { useStopPlayerOnProjectChange } from "./useStopPlayerOnProjectChange";

// Local drag order synced to the server track set. The order is only reset
// when the *set* of ids changes (track added/archived) — a refetch that keeps
// the same ids must not clobber the order the user just dragged.
function useOrderedTrackIds(tracks: TrackResponse[]) {
  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    tracks.map((t) => t.id),
  );
  const prevServerIdsRef = useRef<string[]>(tracks.map((t) => t.id));

  useEffect(() => {
    const serverIds = tracks.map((t) => t.id);
    const prev = new Set(prevServerIdsRef.current);
    const next = new Set(serverIds);
    prevServerIdsRef.current = serverIds;
    const setsMatch =
      prev.size === next.size && [...next].every((id) => prev.has(id));
    if (!setsMatch) setOrderedIds(serverIds);
  }, [tracks]);

  const orderedTracks = useMemo(
    () =>
      orderedIds
        .map((id) => tracks.find((t) => t.id === id))
        .filter((t): t is TrackResponse => t !== undefined),
    [orderedIds, tracks],
  );

  return { orderedIds, setOrderedIds, orderedTracks };
}

export function useProjectDetail(projectId: string) {
  const project = useProject(projectId);
  const tracksQuery = useTracks(projectId);
  const tracks = tracksQuery.data ?? [];
  const updateProject = useUpdateProject(projectId);
  const reorderTracks = useReorderTracks(projectId);
  const currentUser = useAuthStore((s) => s.user);

  const commentsQuery = useProjectComments(projectId);
  const addProjectComment = useAddProjectComment(projectId);
  const deleteProjectComment = useDeleteProjectComment(projectId);

  const { orderedIds, setOrderedIds, orderedTracks } =
    useOrderedTrackIds(tracks);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );
  const [createTrackOpen, setCreateTrackOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const archivedQuery = useArchivedTracks(projectId, showArchived);

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
      {
        onError: (err) => {
          setOrderedIds(previousIds);
          notifyError(err, "Impossible de réordonner les tracks.");
        },
      },
    );
  };

  return {
    projectId,
    project: project.data,
    projectLoading: project.isLoading,
    projectError: project.isError,
    projectErrorObj: project.error,
    refetchProject: project.refetch,
    currentUser,
    updateProject,
    tracks,
    tracksLoading: tracksQuery.isLoading,
    isTracksError: tracksQuery.isError,
    orderedIds,
    orderedTracks,
    sensors,
    handleDragEnd,
    reorderPending: reorderTracks.isPending,
    createTrackOpen,
    setCreateTrackOpen,
    settingsOpen,
    setSettingsOpen,
    showArchived,
    setShowArchived,
    archivedTracks: archivedQuery.data ?? [],
    archivedLoading: archivedQuery.isLoading,
    isArchivedError: archivedQuery.isError,
    projectComments: commentsQuery.data ?? [],
    commentsLoading: commentsQuery.isLoading,
    commentsError: commentsQuery.isError,
    addProjectComment,
    deleteProjectComment,
  };
}
