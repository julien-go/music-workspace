import { useQuery } from "@tanstack/react-query";
import { getTrackVersions } from "../api";

export function useTrackVersions(projectId: string, trackId: string) {
  return useQuery({
    queryKey: ["trackVersions", projectId, trackId],
    queryFn: () => getTrackVersions(projectId, trackId),
  });
}
