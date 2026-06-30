import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTrackComment } from "../api";

export function useDeleteTrackComment(projectId: string, trackId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteTrackComment(projectId, trackId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackComments", projectId, trackId] });
    },
  });
}
