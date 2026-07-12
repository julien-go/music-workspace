import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { addTrackComment } from "../api";

export function useAddTrackComment(projectId: string, trackId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => addTrackComment(projectId, trackId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trackComments(projectId, trackId) });
    },
  });
}
