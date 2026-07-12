import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { addProjectComment } from "../api";

export function useAddProjectComment(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => addProjectComment(projectId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectComments(projectId) });
    },
  });
}
