import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { updateTrackVersion } from "../api";
import type { UpdateTrackVersionRequest } from "../types";

export function useUpdateTrackVersion(projectId: string, trackId: string, versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTrackVersionRequest) =>
      updateTrackVersion(projectId, trackId, versionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trackVersions(projectId, trackId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tracks(projectId) });
    },
  });
}
