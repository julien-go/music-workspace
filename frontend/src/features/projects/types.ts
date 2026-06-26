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
