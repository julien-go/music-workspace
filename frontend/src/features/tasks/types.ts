export type TaskStatus = "TODO" | "DOING" | "DONE";

export interface TaskUser {
  id: string;
  username: string;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdBy: TaskUser;
  assignedTo: TaskUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  assignedToId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  status?: TaskStatus;
  assignedToId?: string | null;
}
