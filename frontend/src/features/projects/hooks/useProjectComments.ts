import { useQuery } from "@tanstack/react-query";
import { getProjectComments } from "../api";

export function useProjectComments(projectId: string) {
  return useQuery({
    queryKey: ["projectComments", projectId],
    queryFn: () => getProjectComments(projectId),
  });
}
