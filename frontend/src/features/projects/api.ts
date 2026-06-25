import { fetchApi } from "@/lib/api";
import type { ProjectResponse, CreateProjectRequest } from "./types";

export function getProjects() {
  return fetchApi<ProjectResponse[]>("/projects");
}

export function createProject(data: CreateProjectRequest) {
  return fetchApi<ProjectResponse>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
