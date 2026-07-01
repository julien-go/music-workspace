import { useQuery } from "@tanstack/react-query";
import { getVersionComments } from "../api";

export function useVersionComments(projectId: string, trackId: string, versionId: string) {
  return useQuery({
    queryKey: ["versionComments", projectId, trackId, versionId],
    queryFn: () => getVersionComments(projectId, trackId, versionId),
  });
}
