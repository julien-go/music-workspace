import { useMutation } from "@tanstack/react-query";
import { reorderTracks } from "../api";

export function useReorderTracks(projectId: string) {
  return useMutation({
    mutationFn: ({ trackIds }: { trackIds: string[] }) => reorderTracks(projectId, trackIds),
  });
}
