import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { archiveTrack } from "../api";
import type { TrackResponse } from "../types";

export function useArchiveTrack(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (trackId: string) => archiveTrack(projectId, trackId),
    onMutate: async (trackId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tracks(projectId) });
      const previous = queryClient.getQueryData<TrackResponse[]>(queryKeys.tracks(projectId));
      queryClient.setQueryData<TrackResponse[]>(queryKeys.tracks(projectId), (old) =>
        old ? old.filter((t) => t.id !== trackId) : []
      );
      return { previous };
    },
    onError: (_err, _trackId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tracks(projectId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tracks(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.archivedTracks(projectId) });
    },
  });
}
