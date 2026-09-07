import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { getFileExtension, stripFileExtension } from "@/lib/utils";
import { useVersionComments } from "./useVersionComments";
import { useAddVersionComment } from "./useAddVersionComment";
import { useDeleteVersionComment } from "./useDeleteVersionComment";
import { useUpdateTrackVersion } from "./useUpdateTrackVersion";
import type { TrackVersionResponse } from "../types";

export function useVersionCard(version: TrackVersionResponse, projectId: string, trackId: string) {
  const [commentsOpen, setCommentsOpen] = useState(true);
  const currentUser = useAuthStore((s) => s.user);

  const updateVersion = useUpdateTrackVersion(projectId, trackId, version.id);

  const fileExtension = getFileExtension(version.originalFileName);
  const fallbackName = version.originalFileName
    ? stripFileExtension(version.originalFileName)
    : null;
  const title = version.label ?? fallbackName;

  const commentsQuery = useVersionComments(projectId, trackId, version.id);
  const addComment = useAddVersionComment(projectId, trackId, version.id);
  const deleteComment = useDeleteVersionComment(projectId, trackId, version.id);

  return {
    commentsOpen,
    setCommentsOpen,
    currentUser,
    updateVersion,
    fileExtension,
    fallbackName,
    title,
    comments: commentsQuery.data ?? [],
    commentsLoading: commentsQuery.isLoading,
    commentsError: commentsQuery.isError,
    addComment,
    deleteComment,
  };
}
