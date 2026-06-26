import { useQuery } from "@tanstack/react-query";
import { getMembers } from "../api";

export function useMembers(projectId: string) {
  return useQuery({
    queryKey: ["members", projectId],
    queryFn: () => getMembers(projectId),
  });
}
