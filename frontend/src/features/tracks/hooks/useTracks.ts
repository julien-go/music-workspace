import { useQuery } from "@tanstack/react-query";
import { getTracks } from "../api";

export function useTracks(projectId: string) {
  return useQuery({
    queryKey: ["tracks", projectId],
    queryFn: () => getTracks(projectId),
  });
}
