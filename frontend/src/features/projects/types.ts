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
  owner: ProjectOwner;
  currentUserRole: ProjectRole;
  trackCount?: number;
  taskCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}
