import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTrackVersion } from "../api";

export function useCreateTrackVersion(projectId: string, trackId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, notes }: { file: File; notes?: string }) =>
      createTrackVersion(projectId, trackId, file, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["trackVersions", projectId, trackId] });
    },
  });
}
