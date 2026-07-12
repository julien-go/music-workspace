import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getArchivedTracks } from "../api";

export function useArchivedTracks(projectId: string, enabled = false) {
  return useQuery({
    queryKey: queryKeys.archivedTracks(projectId),
    queryFn: () => getArchivedTracks(projectId),
    enabled,
  });
}
