import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getProjects } from "../api";

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects(),
    queryFn: getProjects,
  });
}
