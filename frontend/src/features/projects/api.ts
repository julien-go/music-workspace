import { fetchApi } from "@/lib/api";
import type { CommentResponse } from "@/features/comments/types";
import type {
  ProjectResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectMemberResponse,
  InviteMemberRequest,
  ProjectRole,
} from "./types";

export function getProjects() {
  return fetchApi<ProjectResponse[]>("/projects");
}

export function getProject(projectId: string) {
  return fetchApi<ProjectResponse>(`/projects/${projectId}`);
}

export function createProject(data: CreateProjectRequest) {
  return fetchApi<ProjectResponse>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProject(projectId: string, data: UpdateProjectRequest) {
  return fetchApi<ProjectResponse>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteProject(projectId: string) {
  return fetchApi<void>(`/projects/${projectId}`, {
    method: "DELETE",
  });
}

export function getMembers(projectId: string) {
  return fetchApi<ProjectMemberResponse[]>(`/projects/${projectId}/members`);
}

export function addMember(projectId: string, data: InviteMemberRequest) {
  return fetchApi<ProjectMemberResponse>(`/projects/${projectId}/members`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMemberRole(projectId: string, userId: string, role: Exclude<ProjectRole, "OWNER">) {
  return fetchApi<ProjectMemberResponse>(`/projects/${projectId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function removeMember(projectId: string, userId: string) {
  return fetchApi<void>(`/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
  });
}

export function getProjectComments(projectId: string) {
  return fetchApi<CommentResponse[]>(`/projects/${projectId}/comments`);
}

export function addProjectComment(projectId: string, content: string) {
  return fetchApi<CommentResponse>(`/projects/${projectId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function deleteProjectComment(projectId: string, commentId: string) {
  return fetchApi<void>(`/projects/${projectId}/comments/${commentId}`, {
    method: "DELETE",
  });
}

export function uploadCover(projectId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return fetchApi<ProjectResponse>(`/projects/${projectId}/cover`, {
    method: "POST",
    body: formData,
  });
}
