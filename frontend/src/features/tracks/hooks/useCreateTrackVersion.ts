import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { createTrackVersion } from "../api";

export function useCreateTrackVersion(projectId: string, trackId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, notes, label }: { file: File; notes?: string; label?: string }) =>
      createTrackVersion(projectId, trackId, file, { notes, label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tracks(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trackVersions(projectId, trackId) });
    },
  });
}
