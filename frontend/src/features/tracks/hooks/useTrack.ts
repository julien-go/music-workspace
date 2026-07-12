import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getTrack } from "../api";

export function useTrack(projectId: string, trackId: string) {
  return useQuery({
    queryKey: queryKeys.track(projectId, trackId),
    queryFn: () => getTrack(projectId, trackId),
  });
}
