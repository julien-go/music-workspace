import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "../api";
import type { CreateTaskRequest } from "../types";

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskRequest) => createTask(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
}
