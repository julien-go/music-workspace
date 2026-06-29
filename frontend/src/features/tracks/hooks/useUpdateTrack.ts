import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTrack } from "../api";
import type { UpdateTrackRequest } from "../types";

export function useUpdateTrack(projectId: string, trackId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTrackRequest) => updateTrack(projectId, trackId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks", projectId] });
    },
  });
}
