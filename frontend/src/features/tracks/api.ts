import { fetchApi } from "@/lib/api";
import type { TrackResponse, TrackVersionResponse, CreateTrackRequest, UpdateTrackRequest } from "./types";

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

export function getArchivedTracks(projectId: string) {
  return fetchApi<TrackResponse[]>(`/projects/${projectId}/tracks?archived=true`);
}

export function getTrackVersions(projectId: string, trackId: string) {
  return fetchApi<TrackVersionResponse[]>(`/projects/${projectId}/tracks/${trackId}/versions`);
}

export function createTrackVersion(projectId: string, trackId: string, file: File, notes?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (notes) formData.append("notes", notes);
  return fetchApi<TrackVersionResponse>(`/projects/${projectId}/tracks/${trackId}/versions`, {
    method: "POST",
    body: formData,
  });
}
