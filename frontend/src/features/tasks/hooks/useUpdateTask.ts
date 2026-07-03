import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTask } from "../api";
import type { UpdateTaskRequest, TaskResponse } from "../types";

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: string;
      data: UpdateTaskRequest;
    }) => updateTask(projectId, taskId, data),
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
      const previous = queryClient.getQueryData<TaskResponse[]>([
        "tasks",
        projectId,
      ]);
      const { ...spreadableData } = data;
      queryClient.setQueryData<TaskResponse[]>(["tasks", projectId], (old) =>
        old
          ? old.map((t) => (t.id === taskId ? { ...t, ...spreadableData } : t))
          : [],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["tasks", projectId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
}
