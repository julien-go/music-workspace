import type { CommentResponse } from "@/features/comments/types";

export type TrackStatus = "DRAFT" | "IN_PROGRESS" | "DONE";

export const TRACK_STATUS_LABEL: Record<TrackStatus, string> = {
  DRAFT: "Brouillon",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
};

export const TRACK_STATUS_CLASS: Record<TrackStatus, string> = {
  DRAFT: "text-muted-foreground border-border",
  IN_PROGRESS: "text-amber-400 border-amber-400/40",
  DONE: "text-emerald-400 border-emerald-400/40",
};

export interface TrackResponse {
  id: string;
  position: number;
  name: string;
  description: string | null;
  status: TrackStatus;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  versionCount: number;
  lastVersionNote: string | null;
  lastComment: CommentResponse | null;
}

export interface TrackVersionResponse {
  id: string;
  versionNumber: number;
  audioUrl: string;
  notes: string | null;
  label: string | null;
  originalFileName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTrackVersionRequest {
  label?: string;
  notes?: string;
}

export interface CreateTrackRequest {
  name: string;
  description?: string;
  status?: TrackStatus;
}

export interface UpdateTrackRequest {
  name?: string;
  description?: string;
  status?: TrackStatus;
}
