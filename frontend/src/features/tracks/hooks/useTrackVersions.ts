import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getTrackVersions } from "../api";

export function useTrackVersions(projectId: string, trackId: string) {
  return useQuery({
    queryKey: queryKeys.trackVersions(projectId, trackId),
    queryFn: () => getTrackVersions(projectId, trackId),
  });
}
