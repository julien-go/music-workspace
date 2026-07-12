import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getProjectComments } from "../api";

export function useProjectComments(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projectComments(projectId),
    queryFn: () => getProjectComments(projectId),
  });
}
