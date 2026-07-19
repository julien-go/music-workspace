import { fetchApi } from "@/lib/api";
import type {
  TrackResponse,
  TrackVersionResponse,
  CreateTrackRequest,
  UpdateTrackRequest,
  UpdateTrackVersionRequest,
} from "./types";
import type { CommentResponse } from "@/features/comments/types";

export function getTracks(projectId: string) {
  return fetchApi<TrackResponse[]>(`/projects/${projectId}/tracks`);
}

export function createTrack(projectId: string, data: CreateTrackRequest) {
  return fetchApi<TrackResponse>(`/projects/${projectId}/tracks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTrack(projectId: string, trackId: string, data: UpdateTrackRequest) {
  return fetchApi<TrackResponse>(`/projects/${projectId}/tracks/${trackId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function archiveTrack(projectId: string, trackId: string) {
  return fetchApi<TrackResponse>(`/projects/${projectId}/tracks/${trackId}/archive`, {
    method: "PATCH",
  });
}

export function unarchiveTrack(projectId: string, trackId: string) {
  return fetchApi<TrackResponse>(`/projects/${projectId}/tracks/${trackId}/unarchive`, {
    method: "PATCH",
  });
}

export function reorderTracks(projectId: string, trackIds: string[]) {
  return fetchApi<TrackResponse[]>(`/projects/${projectId}/tracks/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ trackIds }),
  });
}

export function getArchivedTracks(projectId: string) {
  return fetchApi<TrackResponse[]>(`/projects/${projectId}/tracks?archived=true`);
}

export function getTrack(projectId: string, trackId: string) {
  return fetchApi<TrackResponse>(`/projects/${projectId}/tracks/${trackId}`);
}

export function getTrackVersions(projectId: string, trackId: string) {
  return fetchApi<TrackVersionResponse[]>(`/projects/${projectId}/tracks/${trackId}/versions`);
}

export function updateTrackVersion(
  projectId: string,
  trackId: string,
  versionId: string,
  data: UpdateTrackVersionRequest,
) {
  return fetchApi<TrackVersionResponse>(
    `/projects/${projectId}/tracks/${trackId}/versions/${versionId}`,
    { method: "PATCH", body: JSON.stringify(data) },
  );
}

export function getTrackComments(projectId: string, trackId: string) {
  return fetchApi<CommentResponse[]>(`/projects/${projectId}/tracks/${trackId}/comments`);
}

export function addTrackComment(projectId: string, trackId: string, content: string) {
  return fetchApi<CommentResponse>(`/projects/${projectId}/tracks/${trackId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function deleteTrackComment(projectId: string, trackId: string, commentId: string) {
  return fetchApi<void>(`/projects/${projectId}/tracks/${trackId}/comments/${commentId}`, {
    method: "DELETE",
  });
}

export function getVersionComments(projectId: string, trackId: string, versionId: string) {
  return fetchApi<CommentResponse[]>(`/projects/${projectId}/tracks/${trackId}/versions/${versionId}/comments`);
}

export function addVersionComment(projectId: string, trackId: string, versionId: string, content: string) {
  return fetchApi<CommentResponse>(`/projects/${projectId}/tracks/${trackId}/versions/${versionId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function deleteVersionComment(
  projectId: string,
  trackId: string,
  versionId: string,
  commentId: string,
) {
  return fetchApi<void>(
    `/projects/${projectId}/tracks/${trackId}/versions/${versionId}/comments/${commentId}`,
    { method: "DELETE" },
  );
}

export function createTrackVersion(
  projectId: string,
  trackId: string,
  file: File,
  metadata?: { notes?: string; label?: string },
) {
  const formData = new FormData();
  formData.append("file", file);
  if (metadata?.notes) formData.append("notes", metadata.notes);
  if (metadata?.label) formData.append("label", metadata.label);
  return fetchApi<TrackVersionResponse>(`/projects/${projectId}/tracks/${trackId}/versions`, {
    method: "POST",
    body: formData,
  });
}
