import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getVersionComments } from "../api";

export function useVersionComments(projectId: string, trackId: string, versionId: string) {
  return useQuery({
    queryKey: queryKeys.versionComments(projectId, trackId, versionId),
    queryFn: () => getVersionComments(projectId, trackId, versionId),
  });
}
