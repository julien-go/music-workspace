import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getTrackComments } from "../api";

export function useTrackComments(projectId: string, trackId: string) {
  return useQuery({
    queryKey: queryKeys.trackComments(projectId, trackId),
    queryFn: () => getTrackComments(projectId, trackId),
  });
}
