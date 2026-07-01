import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveTrack } from "../api";
import type { TrackResponse } from "../types";

export function useArchiveTrack(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (trackId: string) => archiveTrack(projectId, trackId),
    onMutate: async (trackId) => {
      await queryClient.cancelQueries({ queryKey: ["tracks", projectId] });
      const previous = queryClient.getQueryData<TrackResponse[]>(["tracks", projectId]);
      queryClient.setQueryData<TrackResponse[]>(["tracks", projectId], (old) =>
        old ? old.filter((t) => t.id !== trackId) : []
      );
      return { previous };
    },
    onError: (_err, _trackId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["tracks", projectId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tracks", projectId, "archived"] });
    },
  });
}
