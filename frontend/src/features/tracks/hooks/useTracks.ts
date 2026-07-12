import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getTracks } from "../api";

export function useTracks(projectId: string) {
  return useQuery({
    queryKey: queryKeys.tracks(projectId),
    queryFn: () => getTracks(projectId),
  });
}
