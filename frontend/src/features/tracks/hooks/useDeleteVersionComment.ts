import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { deleteVersionComment } from "../api";

export function useDeleteVersionComment(projectId: string, trackId: string, versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteVersionComment(projectId, trackId, versionId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.versionComments(projectId, trackId, versionId),
      });
    },
  });
}
