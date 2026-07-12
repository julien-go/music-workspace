import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { deleteProjectComment } from "../api";

export function useDeleteProjectComment(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteProjectComment(projectId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectComments(projectId) });
    },
  });
}
