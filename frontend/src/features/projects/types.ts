import type { TrackStatus } from "@/features/tracks/types";

export type ProjectRole = "OWNER" | "COLLABORATOR" | "VIEWER";

export interface ProjectOwner {
  id: string;
  username: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  owner: ProjectOwner;
  currentUserRole: ProjectRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface PublicTrackResponse {
  id: string;
  name: string;
  status: TrackStatus;
  versionCount: number;
  latestAudioUrl: string | null;
}

export interface PublicProjectResponse {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  owner: string;
  tracks: PublicTrackResponse[];
}

export interface ProjectMemberUser {
  id: string;
  username: string;
}

export interface ProjectMemberResponse {
  id: string;
  user: ProjectMemberUser;
  role: ProjectRole;
  joinedAt: string;
}

export interface InviteMemberRequest {
  email: string;
  role: Exclude<ProjectRole, "OWNER">;
}

export const ROLE_LABEL: Record<ProjectRole, string> = {
  OWNER: "Propriétaire",
  COLLABORATOR: "Collaborateur",
  VIEWER: "Lecteur",
};

export const ROLE_CLASS: Record<ProjectRole, string> = {
  OWNER: "text-accent border-accent/40",
  COLLABORATOR: "text-foreground border-border",
  VIEWER: "text-muted-foreground border-border",
};
