import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTrackVersion } from "../api";

export function useCreateTrackVersion(projectId: string, trackId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, notes, label }: { file: File; notes?: string; label?: string }) =>
      createTrackVersion(projectId, trackId, file, notes, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["trackVersions", projectId, trackId] });
    },
  });
}
