import { useQuery } from "@tanstack/react-query";
import { getTrack } from "../api";

export function useTrack(projectId: string, trackId: string) {
  return useQuery({
    queryKey: ["tracks", projectId, trackId],
    queryFn: () => getTrack(projectId, trackId),
  });
}
