import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProject } from "../api";
import type { UpdateProjectRequest } from "../types";

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProjectRequest) => updateProject(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
