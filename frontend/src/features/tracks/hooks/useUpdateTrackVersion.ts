import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTrackVersion } from "../api";
import type { UpdateTrackVersionRequest } from "../types";

export function useUpdateTrackVersion(projectId: string, trackId: string, versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTrackVersionRequest) =>
      updateTrackVersion(projectId, trackId, versionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackVersions", projectId, trackId] });
      queryClient.invalidateQueries({ queryKey: ["tracks", projectId] });
    },
  });
}
