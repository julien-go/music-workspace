import { useQuery } from "@tanstack/react-query";
import { getArchivedTracks } from "../api";

export function useArchivedTracks(projectId: string, enabled = false) {
  return useQuery({
    queryKey: ["tracks", projectId, "archived"],
    queryFn: () => getArchivedTracks(projectId),
    enabled,
  });
}
