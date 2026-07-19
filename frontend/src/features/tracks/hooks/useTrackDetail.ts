import { useState, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { useProject } from "@/features/projects/hooks/useProject";
import { useTrack } from "./useTrack";
import { useTrackVersions } from "./useTrackVersions";
import { useUpdateTrack } from "./useUpdateTrack";
import { useTrackComments } from "./useTrackComments";
import { useAddTrackComment } from "./useAddTrackComment";
import { useDeleteTrackComment } from "./useDeleteTrackComment";

export function useTrackDetail(projectId: string, trackId: string) {
  const currentUser = useAuthStore((s) => s.user);

  const project = useProject(projectId);
  const track = useTrack(projectId, trackId);
  const versionsQuery = useTrackVersions(projectId, trackId);
  const commentsQuery = useTrackComments(projectId, trackId);

  const updateTrack = useUpdateTrack(projectId, trackId);
  const addTrackComment = useAddTrackComment(projectId, trackId);
  const deleteTrackComment = useDeleteTrackComment(projectId, trackId);
  const [addVersionOpen, setAddVersionOpen] = useState(false);

  const versionsData = versionsQuery.data;
  const versions = versionsData ?? [];
  const sortedVersions = useMemo(
    () => [...(versionsData ?? [])].sort((a, b) => b.versionNumber - a.versionNumber),
    [versionsData],
  );

  const projectData = project.data;
  const trackData = track.data;
  const hasWriteRole =
    projectData?.currentUserRole === "OWNER" || projectData?.currentUserRole === "COLLABORATOR";
  // Everything on an archived track is read-only server-side (409) — don't
  // show edit affordances that can only fail.
  const canEdit = !!hasWriteRole && !!trackData && !trackData.archived;
  const isOwner = projectData?.currentUserRole === "OWNER";

  return {
    projectId,
    trackId,
    currentUser,
    project: projectData,
    track: trackData,
    loading: project.isLoading || track.isLoading,
    isError: project.isError || track.isError,
    errorObj: project.error ?? track.error,
    refetch: () => {
      project.refetch();
      track.refetch();
    },
    versions,
    sortedVersions,
    versionsLoading: versionsQuery.isLoading,
    versionsError: versionsQuery.isError,
    trackComments: commentsQuery.data ?? [],
    commentsLoading: commentsQuery.isLoading,
    commentsError: commentsQuery.isError,
    updateTrack,
    addTrackComment,
    deleteTrackComment,
    addVersionOpen,
    setAddVersionOpen,
    canEdit,
    isOwner,
  };
}
