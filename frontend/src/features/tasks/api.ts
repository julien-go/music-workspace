import { fetchApi } from "@/lib/api";
import type { TaskResponse, CreateTaskRequest, UpdateTaskRequest } from "./types";

export function getTasks(projectId: string) {
  return fetchApi<TaskResponse[]>(`/projects/${projectId}/tasks`);
}

export function createTask(projectId: string, data: CreateTaskRequest) {
  return fetchApi<TaskResponse>(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTask(projectId: string, taskId: string, data: UpdateTaskRequest) {
  return fetchApi<TaskResponse>(`/projects/${projectId}/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteTask(projectId: string, taskId: string) {
  return fetchApi<void>(`/projects/${projectId}/tasks/${taskId}`, {
    method: "DELETE",
  });
}
