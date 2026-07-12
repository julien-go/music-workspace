import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { unarchiveTrack } from "../api";
import type { TrackResponse } from "../types";

export function useUnarchiveTrack(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (trackId: string) => unarchiveTrack(projectId, trackId),
    onMutate: async (trackId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tracks(projectId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.archivedTracks(projectId) });

      const previousActive = queryClient.getQueryData<TrackResponse[]>(queryKeys.tracks(projectId));
      const previousArchived = queryClient.getQueryData<TrackResponse[]>(queryKeys.archivedTracks(projectId));

      const unarchivedTrack = previousArchived?.find((t) => t.id === trackId);
      if (unarchivedTrack) {
        queryClient.setQueryData<TrackResponse[]>(queryKeys.tracks(projectId), (old) =>
          old ? [...old, { ...unarchivedTrack, archived: false }] : [{ ...unarchivedTrack, archived: false }]
        );
      }

      queryClient.setQueryData<TrackResponse[]>(queryKeys.archivedTracks(projectId), (old) =>
        old ? old.filter((t) => t.id !== trackId) : []
      );

      return { previousActive, previousArchived };
    },
    onError: (_err, _trackId, context) => {
      if (context?.previousActive) {
        queryClient.setQueryData(queryKeys.tracks(projectId), context.previousActive);
      }
      if (context?.previousArchived) {
        queryClient.setQueryData(queryKeys.archivedTracks(projectId), context.previousArchived);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tracks(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.archivedTracks(projectId) });
    },
  });
}
