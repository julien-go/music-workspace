import type { CommentResponse } from "@/features/comments/types";

export type TrackStatus = "DRAFT" | "IN_PROGRESS" | "DONE";

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
