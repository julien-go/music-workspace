import { useQuery } from "@tanstack/react-query";
import { getTrackComments } from "../api";

export function useTrackComments(projectId: string, trackId: string) {
  return useQuery({
    queryKey: ["trackComments", projectId, trackId],
    queryFn: () => getTrackComments(projectId, trackId),
  });
}
