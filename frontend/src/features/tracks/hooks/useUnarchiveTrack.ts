import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unarchiveTrack } from "../api";
import type { TrackResponse } from "../types";

export function useUnarchiveTrack(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (trackId: string) => unarchiveTrack(projectId, trackId),
    onMutate: async (trackId) => {
      await queryClient.cancelQueries({ queryKey: ["tracks", projectId] });
      await queryClient.cancelQueries({ queryKey: ["tracks", projectId, "archived"] });

      const previousActive = queryClient.getQueryData<TrackResponse[]>(["tracks", projectId]);
      const previousArchived = queryClient.getQueryData<TrackResponse[]>(["tracks", projectId, "archived"]);

      const unarchivedTrack = previousArchived?.find((t) => t.id === trackId);
      if (unarchivedTrack) {
        queryClient.setQueryData<TrackResponse[]>(["tracks", projectId], (old) =>
          old ? [...old, { ...unarchivedTrack, archived: false }] : [{ ...unarchivedTrack, archived: false }]
        );
      }

      queryClient.setQueryData<TrackResponse[]>(["tracks", projectId, "archived"], (old) =>
        old ? old.filter((t) => t.id !== trackId) : []
      );

      return { previousActive, previousArchived };
    },
    onError: (_err, _trackId, context) => {
      if (context?.previousActive) {
        queryClient.setQueryData(["tracks", projectId], context.previousActive);
      }
      if (context?.previousArchived) {
        queryClient.setQueryData(["tracks", projectId, "archived"], context.previousArchived);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tracks", projectId, "archived"] });
    },
  });
}
